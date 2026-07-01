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

    return NextResponse.json({ success: true, message: 'CMS Database Seeded!' });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
