import { Helmet } from "react-helmet";

const Seo = ({ title, description, url, image, color = "#5865F2", siteName }: SeoProps) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {siteName && <meta property="og:site_name" content={siteName} />}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Discord Embed Meta Tags */}
      <meta name="theme-color" content={color} />
      
      {/* Additional Open Graph tags that Discord uses */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={description} />
    </Helmet>
  );
};

export default Seo;