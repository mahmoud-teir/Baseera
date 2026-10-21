import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web document shell (static rendering). The whole site is Arabic and right-to-left,
 * so `dir="rtl"` and `lang="ar"` are set on <html> for correct bidi, shaping and screen readers.
 */
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html {...htmlAttributes} lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="description" content="بصيرة — رحلتك في طلب العلم الشرعي. من الكتاب والسنة بفهم السلف الصالح · مجاني بالكامل." />
        <meta name="theme-color" content="#145C4B" />
        <meta property="og:title" content="بصيرة · Baseerah" />
        <meta property="og:description" content="أكاديمية مراحل، قرآن، مكتبة وصوتيات، موسوعة، صلاة وأذكار — مجانًا وبلا إعلانات." />
        <meta property="og:locale" content="ar_AR" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const css = `
html, body { background-color: #FAF8F2; }
@media (prefers-color-scheme: dark) { html, body { background-color: #0E2A25; } }
body { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
input, textarea { font-family: inherit; }
*:focus:not(:focus-visible) { outline: none; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;
