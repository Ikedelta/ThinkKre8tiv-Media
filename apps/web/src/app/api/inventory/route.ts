import sql from '@/app/api/utils/sql';
import { requireStaffOrAdmin } from '@/lib/api-security';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const history = searchParams.get('history') === 'true';

    // Single item fetch (optionally with stock transaction ledger)
    if (id) {
      const [item] = await sql`
        SELECT i.*, v.name as supplier_name, v.company as supplier_company
        FROM inventory_items i
        LEFT JOIN vendors v ON i.supplier_id = v.id
        WHERE i.id = ${id}
      `;
      if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

      if (history) {
        const transactions = await sql`
          SELECT * FROM inventory_transactions
          WHERE item_id = ${id}
          ORDER BY created_at DESC
          LIMIT 100
        `;
        return Response.json({ item, transactions });
      }

      return Response.json(item);
    }

    // List all inventory items with supplier names
    const items = await sql`
      SELECT i.*, v.name as supplier_name, v.company as supplier_company
      FROM inventory_items i
      LEFT JOIN vendors v ON i.supplier_id = v.id
      ORDER BY i.name ASC
    `;

    // Also get KPI metrics for Refine dashboard cards
    const [metrics] = await sql`
      SELECT 
        COUNT(*)::int as total_sku_count,
        COALESCE(SUM(quantity_on_hand * cost_price), 0)::numeric as total_valuation,
        COUNT(*) FILTER (WHERE quantity_on_hand <= min_reorder_level)::int as low_stock_count,
        COUNT(*) FILTER (WHERE quantity_on_hand = 0)::int as out_of_stock_count
      FROM inventory_items
    `;

    // Fetch recent stock ledger events
    const recentMovements = await sql`
      SELECT t.*, i.name as item_name, i.sku, i.unit
      FROM inventory_transactions t
      JOIN inventory_items i ON t.item_id = i.id
      ORDER BY t.created_at DESC
      LIMIT 15
    `;

    return Response.json({ items, metrics, recentMovements });
  } catch (error: any) {
    console.error('Inventory GET error:', error);
    return Response.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;

    const session = await auth.api.getSession({ headers: await headers() });
    const userDisplayName = session?.user?.name || 'Staff User';

    const body = await request.json();
    const { action } = body;

    // ACTION: ADJUST STOCK / STOCK TRANSACTION
    if (action === 'adjust_stock') {
      const { item_id, type, quantity, notes, reference_number, unit_cost } = body;
      if (!item_id || !type || quantity === undefined) {
        return Response.json({ error: 'Missing required adjustment fields' }, { status: 400 });
      }

      const numQty = Number(quantity);
      if (isNaN(numQty) || numQty <= 0) {
        return Response.json({ error: 'Quantity must be a positive number' }, { status: 400 });
      }

      const [item] = await sql`SELECT * FROM inventory_items WHERE id = ${item_id}`;
      if (!item) return Response.json({ error: 'Inventory item not found' }, { status: 404 });

      const currentQty = Number(item.quantity_on_hand);
      let newQty = currentQty;

      if (type === 'IN' || type === 'RESTOCK' || type === 'PURCHASE') {
        newQty = currentQty + numQty;
      } else if (type === 'OUT' || type === 'DISPATCH' || type === 'USAGE') {
        if (numQty > currentQty) {
          return Response.json({ error: `Insufficient stock! Only ${currentQty} ${item.unit} available.` }, { status: 400 });
        }
        newQty = currentQty - numQty;
      } else if (type === 'SET' || type === 'COUNT_AUDIT') {
        newQty = numQty;
      } else {
        return Response.json({ error: 'Invalid stock adjustment type' }, { status: 400 });
      }

      // Update item balance
      await sql`
        UPDATE inventory_items
        SET quantity_on_hand = ${newQty},
            updated_at = NOW()
        WHERE id = ${item_id}
      `;

      // Record transaction into ledger
      await sql`
        INSERT INTO inventory_transactions (
          item_id, type, quantity, unit_cost, balance_after, reference_number, notes, performed_by
        ) VALUES (
          ${item_id}, ${type}, ${numQty}, ${unit_cost ?? item.cost_price}, ${newQty}, ${reference_number ?? null}, ${notes ?? null}, ${userDisplayName}
        )
      `;

      // Log system activity
      await sql`
        INSERT INTO activity_logs (user_name, action, resource, details)
        VALUES (
          ${userDisplayName}, 
          'Adjusted Stock', 
          'inventory', 
          ${`${type} ${numQty} ${item.unit} for ${item.name} (SKU: ${item.sku}). New balance: ${newQty}`}
        )
      `;

      return Response.json({ success: true, new_balance: newQty });
    }

    // ACTION: BULK IMPORT FROM EXCEL
    if (action === 'bulk_import') {
      const { items: importItems } = body;
      if (!Array.isArray(importItems) || importItems.length === 0) {
        return Response.json({ error: 'No items provided for import' }, { status: 400 });
      }

      let importedCount = 0;
      let updatedCount = 0;

      for (const row of importItems) {
        const rawSku = row.sku || row.SKU || row['Item Code'] || row['Item Code*'] || `MAT-${Math.floor(1000 + Math.random() * 9000)}`;
        const rawName = row.name || row.Name || row['Item Name'] || row['Material Name'] || row['Description'];
        if (!rawName) continue;

        const cleanSku = String(rawSku).trim().toUpperCase();
        const cleanName = String(rawName).trim();
        const category = String(row.category || row.Category || 'signage_materials').trim().toLowerCase().replace(/\s+/g, '_');
        const unit = String(row.unit || row.Unit || 'units').trim().toLowerCase();
        const qty = Number(row.quantity_on_hand ?? row.quantity ?? row.Qty ?? row.Stock ?? 0);
        const minLevel = Number(row.min_reorder_level ?? row.min_level ?? row['Min Alert'] ?? 5);
        const costPrice = Number(row.cost_price ?? row.cost ?? row['Cost Price'] ?? 0);
        const sellingPrice = Number(row.selling_price ?? row.price ?? row['Selling Price'] ?? 0);
        const location = String(row.location || row.Location || row['Rack / Shelf'] || 'Accra Main Factory').trim();
        const description = row.description || row.Notes || null;

        // Upsert into inventory_items
        const [existing] = await sql`SELECT id, quantity_on_hand FROM inventory_items WHERE UPPER(sku) = ${cleanSku}`;

        if (existing) {
          await sql`
            UPDATE inventory_items
            SET 
              name = ${cleanName},
              category = ${category},
              unit = ${unit},
              quantity_on_hand = ${qty >= 0 ? qty : existing.quantity_on_hand},
              min_reorder_level = ${minLevel},
              cost_price = ${costPrice},
              selling_price = ${sellingPrice},
              location = ${location},
              description = ${description},
              updated_at = NOW()
            WHERE id = ${existing.id}
          `;
          updatedCount++;
        } else {
          const [inserted] = await sql`
            INSERT INTO inventory_items (
              sku, name, category, unit, quantity_on_hand, min_reorder_level, cost_price, selling_price, location, description
            ) VALUES (
              ${cleanSku}, ${cleanName}, ${category}, ${unit}, ${qty >= 0 ? qty : 0}, ${minLevel}, ${costPrice}, ${sellingPrice}, ${location}, ${description}
            )
            RETURNING id
          `;

          if (qty > 0) {
            await sql`
              INSERT INTO inventory_transactions (
                item_id, type, quantity, unit_cost, balance_after, reference_number, notes, performed_by
              ) VALUES (
                ${inserted.id}, 'EXCEL_IMPORT', ${qty}, ${costPrice}, ${qty}, 'INITIAL_IMPORT', 'Imported via Excel spreadsheet', ${userDisplayName}
              )
            `;
          }
          importedCount++;
        }
      }

      await sql`
        INSERT INTO activity_logs (user_name, action, resource, details)
        VALUES (${userDisplayName}, 'Excel Inventory Import', 'inventory', ${`Imported ${importedCount} new items, updated ${updatedCount} existing items`})
      `;

      return Response.json({
        success: true,
        imported: importedCount,
        updated: updatedCount,
        total: importedCount + updatedCount,
      });
    }

    // ACTION: CREATE NEW INVENTORY ITEM
    const {
      sku,
      name,
      category,
      unit,
      quantity_on_hand,
      min_reorder_level,
      cost_price,
      selling_price,
      location,
      supplier_id,
      description,
    } = body;

    if (!sku || !name) {
      return Response.json({ error: 'SKU and item name are required' }, { status: 400 });
    }

    const cleanSku = String(sku).trim().toUpperCase();

    // Check SKU collision
    const [existing] = await sql`SELECT id FROM inventory_items WHERE UPPER(sku) = ${cleanSku}`;
    if (existing) {
      return Response.json({ error: `An item with SKU "${cleanSku}" already exists.` }, { status: 400 });
    }

    const [created] = await sql`
      INSERT INTO inventory_items (
        sku, name, category, unit, quantity_on_hand, min_reorder_level, cost_price, selling_price, location, supplier_id, description
      ) VALUES (
        ${cleanSku},
        ${name.trim()},
        ${category || 'raw_materials'},
        ${unit || 'units'},
        ${Number(quantity_on_hand) || 0},
        ${Number(min_reorder_level) || 5},
        ${Number(cost_price) || 0},
        ${Number(selling_price) || 0},
        ${location || 'Accra Main Factory'},
        ${supplier_id || null},
        ${description || null}
      )
      RETURNING *
    `;

    // Initial stock transaction entry if quantity > 0
    if (Number(quantity_on_hand) > 0) {
      await sql`
        INSERT INTO inventory_transactions (
          item_id, type, quantity, unit_cost, balance_after, reference_number, notes, performed_by
        ) VALUES (
          ${created.id}, 'OPENING_STOCK', ${Number(quantity_on_hand)}, ${Number(cost_price) || 0}, ${Number(quantity_on_hand)}, 'INITIAL_SETUP', 'Initial opening stock count', ${userDisplayName}
        )
      `;
    }

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, details)
      VALUES (${userDisplayName}, 'Created Inventory Item', 'inventory', ${`Created ${cleanSku} - ${name}`})
    `;

    return Response.json({ success: true, item: created });
  } catch (error: any) {
    console.error('Inventory POST error:', error);
    return Response.json({ error: error.message || 'Failed to create inventory item' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;

    const session = await auth.api.getSession({ headers: await headers() });
    const userDisplayName = session?.user?.name || 'Staff User';

    const body = await request.json();
    const {
      id,
      sku,
      name,
      category,
      unit,
      min_reorder_level,
      cost_price,
      selling_price,
      location,
      supplier_id,
      description,
    } = body;

    if (!id) return Response.json({ error: 'Item ID required' }, { status: 400 });

    const cleanSku = sku ? String(sku).trim().toUpperCase() : undefined;

    const [updated] = await sql`
      UPDATE inventory_items
      SET 
        sku = COALESCE(${cleanSku}, sku),
        name = COALESCE(${name?.trim()}, name),
        category = COALESCE(${category}, category),
        unit = COALESCE(${unit}, unit),
        min_reorder_level = COALESCE(${min_reorder_level !== undefined ? Number(min_reorder_level) : null}, min_reorder_level),
        cost_price = COALESCE(${cost_price !== undefined ? Number(cost_price) : null}, cost_price),
        selling_price = COALESCE(${selling_price !== undefined ? Number(selling_price) : null}, selling_price),
        location = COALESCE(${location}, location),
        supplier_id = ${supplier_id || null},
        description = ${description ?? null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) return Response.json({ error: 'Item not found' }, { status: 404 });

    await sql`
      INSERT INTO activity_logs (user_name, action, resource, details)
      VALUES (${userDisplayName}, 'Updated Inventory Item', 'inventory', ${`Updated ${updated.sku} - ${updated.name}`})
    `;

    return Response.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Inventory PUT error:', error);
    return Response.json({ error: error.message || 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireStaffOrAdmin();
    if (authResult instanceof Response) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

    const [deleted] = await sql`
      DELETE FROM inventory_items WHERE id = ${id} RETURNING sku, name
    `;
    if (!deleted) return Response.json({ error: 'Item not found' }, { status: 404 });

    const session = await auth.api.getSession({ headers: await headers() });
    await sql`
      INSERT INTO activity_logs (user_name, action, resource, details)
      VALUES (${session?.user?.name || 'Staff User'}, 'Deleted Inventory Item', 'inventory', ${`Deleted ${deleted.sku} - ${deleted.name}`})
    `;

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Inventory DELETE error:', error);
    return Response.json({ error: error.message || 'Failed to delete inventory item' }, { status: 500 });
  }
}

