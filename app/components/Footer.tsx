import Link from "next/link";

type FooterCategory = {
  id: string;
  name: string;
  slug: string;
};

type FooterProps = {
  categories?: FooterCategory[];
  onCategoryClick?: (slug: string) => void;
};

const companyLinks = [
  { label: "About", href: "http://loistech.com.ng/#us", external: true },
  {
    label: "Testimonials",
    href: "http://loistech.com.ng/#testimonies",
    external: true,
  },
  { label: "Careers", href: "http://loistech.com.ng/#hiring", external: true },
];

const policyLinks = [
  {
    label: "4-Phase SOP Summary",
    href: "/policies/sop",
    external: false,
  },
  {
    label: "Privacy Policy",
    href: "https://loistech.com.ng/privacy.html",
    external: true,
  },
  {
    label: "Terms & Conditions",
    href: "https://loistech.com.ng/tc.html",
    external: true,
  },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/l0istech?igsh=NzczbDQ4d2RheGx2",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1GgpCW8D73/",
  },
  {
    label: "LinkedIn",
    href: "https://ng.linkedin.com/in/lois-tech-491a15380",
  },
];

// Visa, Mastercard, Verve, and OPay pulled from the about.html partners marquee.
// UnionPay, JCB, and Amex weren't in that source — still placeholders, swap in later.
const paymentMethods = [
  { label: "Visa", src: "https://i.pinimg.com/1200x/bb/7a/43/bb7a43b0bef9e268116078b6e0ef8d81.jpg" },
  { label: "Mastercard", src: "https://i.pinimg.com/1200x/c4/f5/86/c4f586eb82c34b5d04ded5ab2271126e.jpg" },
  { label: "Verve", src: "https://i.imgur.com/sZbF1jN.png" },
  { label: "UnionPay", src: "https://i.imgur.com/MxPWSLJ.png" },
  { label: "JCB", src: "https://i.imgur.com/d5HJHZ4.png" },
  { label: "American Express", src: "https://i.pinimg.com/1200x/bf/52/b8/bf52b87c9c500e5502da41ccb04c9ef1.jpg" },
  { label: "OPay", src: "https://i.pinimg.com/736x/f6/92/23/f692231702deaeec08c5b21598142b65.jpg" },
];

export default function Footer({ categories, onCategoryClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="https://i.imgur.com/IGBf9Dh.png"
                alt="LoisTech"
                className="h-7 w-auto"
              />
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                LOIS TECH
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Privacy-first, build-integrated smart infrastructure for modern
              living.
            </p>
          </div>

          {categories ? (
            <>
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
                  Shop
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {categories.map((cat) => (
                    <li
                      key={cat.id}
                      onClick={() => onCategoryClick?.(cat.slug)}
                      className="hover:text-slate-900 cursor-pointer transition-colors"
                    >
                      {cat.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
                  Company
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {companyLinks.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
                  Trust & Policies
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {policyLinks.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
                  Company
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {companyLinks.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
                  Trust & Policies
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {policyLinks.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="hover:text-slate-900 transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
                  Social
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  {socialLinks.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-slate-900 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 sm:mt-12 pt-8 border-t border-slate-200/60">
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4">
            Pay with
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.label}
                className="h-9 w-14 flex items-center justify-center rounded-md border border-slate-200 bg-white px-2"
              >
                <img
                  src={method.src}
                  alt={method.label}
                  title={method.label}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200/60 mt-10 sm:mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 tracking-widest uppercase">
          <p>© {currentYear} LoisTech. All rights reserved.</p>
          <div className="flex gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}