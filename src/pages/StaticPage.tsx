import { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import AboutPage from './legal/AboutPage';
import ContactPage from './legal/ContactPage';
import PrivacyPolicyPage from './legal/PrivacyPolicyPage';
import TermsPage from './legal/TermsPage';
import DisclaimerPage from './legal/DisclaimerPage';
import CookiePolicyPage from './legal/CookiePolicyPage';
import { SEO, getRouteSEO, SITE_URL, DEFAULT_IMAGE } from '../utils/seo';

const PAGE_CONFIG: Record<string, { title: string; description: string; Component: ComponentType }> = {
  about: {
    title: 'About CivilMath',
    description: 'Learn about CivilMath — a practical civil engineering calculation and knowledge platform designed to make technical construction knowledge easier to understand, calculate and apply.',
    Component: AboutPage,
  },
  contact: {
    title: 'Contact CivilMath',
    description: 'Have a question, found an issue, or want to suggest an improvement? Get in touch with the CivilMath engineering team.',
    Component: ContactPage,
  },
  privacy: {
    title: 'Privacy Policy | CivilMath',
    description: 'CivilMath privacy policy. Clear disclosures regarding locally stored project data, technical information, Google AdSense cookies, and user privacy rights.',
    Component: PrivacyPolicyPage,
  },
  terms: {
    title: 'Terms & Conditions | CivilMath',
    description: 'Terms and conditions for accessing and using CivilMath educational civil engineering calculators, formulas, technical guides, and planning utilities.',
    Component: TermsPage,
  },
  disclaimer: {
    title: 'Disclaimer | CivilMath',
    description: 'Engineering disclaimer and limitation of liability for CivilMath. All calculations are preliminary estimates requiring licensed Professional Engineer verification.',
    Component: DisclaimerPage,
  },
  'cookie-policy': {
    title: 'Cookie Policy | CivilMath',
    description: 'Learn how CivilMath uses essential cookies, local storage, analytics, and Google advertising technologies, with controls to manage your preferences.',
    Component: CookiePolicyPage,
  },
};

export default function StaticPage({ page }: { page: string }) {
  const config = PAGE_CONFIG[page];

  if (!config) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <h1 className="text-2xl font-bold text-[#20231F] dark:text-[#EAE7E0]">Page Not Found</h1>
        <p className="text-xs text-[#7B8978]">The requested legal or information page does not exist.</p>
      </div>
    );
  }

  const path = `/${page}`;
  const seo = getRouteSEO(path);
  const title = seo?.title || config.title;
  const description = seo?.description || config.description;

  const PageComponent = config.Component;

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonicalUrl={`${SITE_URL}${path}`}
        keywords={seo?.keywords}
        ogImage={DEFAULT_IMAGE}
        type="website"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: config.title.replace(' | CivilMath', ''), url: path }]}
      />
      <PageComponent />
    </>
  );
}
