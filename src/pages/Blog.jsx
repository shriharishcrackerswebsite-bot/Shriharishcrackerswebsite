import { blogPosts, getBlogPost } from '../data/blogPosts';
import { navigate } from '../lib/navigate';
import './Blog.css';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T12:00:00+05:30`));
}

function SectionBlock({ section }) {
  if (section.type === 'h2') return <h2>{section.text}</h2>;
  if (section.type === 'h3') return <h3>{section.text}</h3>;
  if (section.type === 'ul') {
    return (
      <ul>
        {section.items.map(item => <li key={item}>{item}</li>)}
      </ul>
    );
  }
  if (section.type === 'ol') {
    return (
      <ol>
        {section.items.map(item => <li key={item}>{item}</li>)}
      </ol>
    );
  }
  return <p>{section.text}</p>;
}

function BlogLinks() {
  return (
    <div className="blog-links">
      <a href="/" onClick={event => { event.preventDefault(); navigate('/'); }}>Shri Harish Crackers home</a>
      <a href="/product-list" onClick={event => { event.preventDefault(); navigate('/product-list'); }}>Product list</a>
      <a href="/blog" onClick={event => { event.preventDefault(); navigate('/blog'); }}>All guides</a>
    </div>
  );
}

export function BlogListPage() {
  return (
    <section className="blog">
      <header className="blog-intro">
        <h1>Crackers Guides for Valliyur</h1>
        <p>
          Practical buying and safety guides from Shri Harish Crackers, a crackers shop in Valliyur, Tamil Nadu.
          Use these articles to plan Diwali crackers shopping, then browse the product list and send an enquiry.
        </p>
      </header>
      <div className="blog-grid">
        {blogPosts.map(post => (
          <a
            key={post.slug}
            className="blog-card"
            href={`/blog/${post.slug}`}
            onClick={event => {
              event.preventDefault();
              navigate(`/blog/${post.slug}`);
            }}
          >
            <time dateTime={post.published}>{formatDate(post.published)}</time>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
          </a>
        ))}
      </div>
      <BlogLinks />
    </section>
  );
}

export function BlogArticlePage({ slug }) {
  const post = getBlogPost(slug);
  if (!post) {
    return (
      <section className="blog-missing">
        <h1>Guide not found</h1>
        <p>That article is not available. Browse the crackers guides or return to the shop.</p>
        <p>
          <a href="/blog" onClick={event => { event.preventDefault(); navigate('/blog'); }}>View all guides</a>
          {' · '}
          <a href="/" onClick={event => { event.preventDefault(); navigate('/'); }}>Home</a>
        </p>
      </section>
    );
  }

  const related = blogPosts.filter(item => item.slug !== post.slug).slice(0, 3);

  return (
    <article className="blog blog-article">
      <header>
        <div className="blog-meta">
          <time dateTime={post.published}>Published {formatDate(post.published)}</time>
          {post.updated !== post.published && (
            <time dateTime={post.updated}>Updated {formatDate(post.updated)}</time>
          )}
        </div>
        <h1>{post.title}</h1>
        <p className="blog-lede">{post.description}</p>
      </header>
      {post.sections.map((section, index) => (
        <SectionBlock key={`${post.slug}-${index}`} section={section} />
      ))}
      <BlogLinks />
      {related.length > 0 && (
        <aside className="blog-related">
          <h2>Related guides</h2>
          <ul>
            {related.map(item => (
              <li key={item.slug}>
                <a
                  href={`/blog/${item.slug}`}
                  onClick={event => {
                    event.preventDefault();
                    navigate(`/blog/${item.slug}`);
                  }}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
