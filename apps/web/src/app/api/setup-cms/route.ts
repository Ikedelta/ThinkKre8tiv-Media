import sql from '@/app/api/utils/sql';
import { NextResponse } from 'next/server';
import { CAROUSEL_SLIDES, EXPERTISE, siteInfo } from '@/data/content';

export async function GET() {
  try {
    // 1. Create table
    await sql`
      CREATE TABLE IF NOT EXISTS cms_content (
        id VARCHAR(255) PRIMARY KEY,
        section VARCHAR(100) NOT NULL,
        title TEXT,
        content TEXT,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 2. Seed siteInfo
    await sql`
      INSERT INTO cms_content (id, section, title, content)
      VALUES 
        ('hero_headline', 'hero', 'Headline', ${siteInfo.heroHeadline}),
        ('hero_subheadline', 'hero', 'Subheadline', ${siteInfo.heroSubheadline})
      ON CONFLICT (id) DO NOTHING
    `;

    // 3. Seed Carousel
    for (let i = 0; i < CAROUSEL_SLIDES.length; i++) {
      const slide = CAROUSEL_SLIDES[i];
      await sql`
        INSERT INTO cms_content (id, section, title, content, image_url, sort_order)
        VALUES (${'carousel_' + i}, 'carousel', ${slide.title}, ${slide.desc}, ${slide.image}, ${i})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 4. Seed Expertise
    for (let i = 0; i < EXPERTISE.length; i++) {
      const exp = EXPERTISE[i];
      await sql`
        INSERT INTO cms_content (id, section, title, content, image_url, sort_order)
        VALUES (${'expertise_' + i}, 'expertise', ${exp.title}, ${exp.desc}, ${exp.image}, ${i})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 5. Seed Comprehensive Sections: CEO, About, Contact, Announcement, Partners
    const masterSections = [
      { id: 'contact_phone', section: 'contact', title: 'Main Customer Phone', content: '+233 24 468 1391' },
      { id: 'contact_phone_alt', section: 'contact', title: 'Secondary Hot Line', content: '+233 24 476 6457' },
      { id: 'contact_email', section: 'contact', title: 'Customer Support Email', content: 'info@thinkkre8tivmedia.com' },
      { id: 'contact_address', section: 'contact', title: 'Facility / Plant Location', content: 'OSU Haramani Sport Complex, Accra, Ghana' },
      { id: 'contact_hours', section: 'contact', title: 'Operating Hours', content: 'Mon – Fri: 8:00 AM – 6:00 PM | Sat: 9:00 AM – 4:00 PM' },
      
      { id: 'about_heritage_title', section: 'about', title: 'Company Heritage Title', content: 'From a Small Studio to Ghana’s Premier Print Partner' },
      { id: 'about_p1', section: 'about', title: 'Our Story (Paragraph 1)', content: 'Established in 2012, Think Kre8tiv Media set out with a simple promise: make high-resolution commercial printing, bespoke packaging, and vibrant signage accessible to growing businesses and multinationals.' },
      { id: 'about_p2', section: 'about', title: 'Capacity (Paragraph 2)', content: 'Today, we run integrated commercial offset presses, digital dye sublimation, and structural acrylic & metal fabrication workshops across Accra. Every job is precision-calibrated to European ISO standard output.' },
      
      { id: 'ceo_name', section: 'ceo', title: 'Chief Executive Officer', content: 'Nii Armah Aryeetey' },
      { id: 'ceo_title', section: 'ceo', title: 'Executive Title', content: 'Chief Executive Officer & Managing Director' },
      { id: 'ceo_quote', section: 'ceo', title: 'Executive Quote', content: 'Every print run is an ambassador of your company’s credibility.' },
      { id: 'ceo_bio', section: 'ceo', title: 'CEO Statement / Vision', content: 'At Think Kre8tiv Media, we founded this enterprise with one non-negotiable principle: zero compromise on substrate weight, Pantone precision, and delivery deadlines. We have invested in multi-color Heidelberg presses and automated die-cutting so Ghanaian corporations never have to import printed collateral.' },
      { id: 'ceo_image', section: 'ceo', title: 'CEO Portrait Image URL', content: '/images/CEO.jpg' },
      
      { id: 'announcement_bar', section: 'announcement', title: 'Top Header Announcement', content: 'Specialist commercial lithography & rigid box packaging — Order today for express turnaround!' },
      { id: 'partners_text', section: 'partners', title: 'Partners Title', content: 'Trusted by Industry Leaders Across West Africa' }
    ];

    for (const item of masterSections) {
      await sql`
        INSERT INTO cms_content (id, section, title, content)
        VALUES (${item.id}, ${item.section}, ${item.title}, ${item.content})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    return NextResponse.json({ success: true, message: 'Comprehensive CMS Database Seeded!' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
