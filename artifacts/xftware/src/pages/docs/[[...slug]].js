import React from 'react';
import fs from 'fs';
import path from 'path';
import DocsLayout from '@/Comp/DocsLayout';
import MarkdownRenderer from '@/Comp/MarkdownRenderer';

export default function DocsSPA({ content, activeId }) {
  if (!content) return null;

  return (
    <DocsLayout title="Dokumentasi" activeId={activeId}>
      <MarkdownRenderer content={content} />
    </DocsLayout>
  );
}

export async function getStaticPaths() {
  const docsDir = path.join(process.cwd(), 'src/docs_content');

  if (!fs.existsSync(docsDir)) {
    return { paths: [], fallback: false };
  }

  const files = fs.readdirSync(docsDir);
  const paths = files
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const slugName = f.replace('.md', '');
      // For optional catch-all [[...slug]].js:
      // /docs matches slug: []
      return {
        params: { slug: slugName === 'overview' ? [] : [slugName] }
      };
    });

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  // If slug is undefined or [] (from /docs), use 'overview'
  const slugArray = params.slug || [];
  const slug = slugArray.length > 0 ? slugArray[0] : 'overview';

  const filePath = path.join(process.cwd(), 'src/docs_content', `${slug}.md`);

  try {
    if (!fs.existsSync(filePath)) {
      return { notFound: true };
    }

    const content = fs.readFileSync(filePath, 'utf8');

    return {
      props: {
        content,
        activeId: slug === 'overview' ? 'index' : slug,
      },
    };
  } catch (err) {
    console.error('Error loading docs:', err);
    return { notFound: true };
  }
}
