// Everything the onboarding form asks, in order. Edit this file to change a
// question or its options; the page, the server check and the Slack summary
// all read from it.
//
// type: text | email | tel | url | date | textarea | select | radio | checkbox
// Radio and checkbox options render as tappable chips.

export const SECTIONS = [
  {
    id: 'you',
    title: 'About you',
    intro: 'Who I will be working with.',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel' },
      { name: 'company', label: 'Company or brand', type: 'text', required: true, autocomplete: 'organization' },
      { name: 'role', label: 'Your role', type: 'text', autocomplete: 'organization-title' },
      { name: 'website', label: 'Current website', type: 'url', placeholder: 'https://', autocomplete: 'url' },
    ],
  },
  {
    id: 'project',
    title: 'The project',
    intro: 'Pick the closest fit. We can shape the details together.',
    fields: [
      {
        name: 'projectType', label: 'What are we making?', type: 'radio', required: true,
        options: ['Brand identity', 'Website', 'Brand + Website', 'Campaign / Advertising', 'Motion / Video', 'Packaging / Print', 'Something else'],
      },
      {
        name: 'services', label: 'Services you need', type: 'checkbox', hint: 'Choose any that apply.',
        options: ['Strategy', 'Naming', 'Logo & identity', 'Brand guidelines', 'Web design', 'Webflow development', 'Copywriting', 'Motion & animation', 'Video production', 'Social content', 'Print & packaging', 'Art direction'],
      },
      { name: 'description', label: 'Tell me about it', type: 'textarea', required: true, placeholder: 'What you do, what you need, and why now.' },
    ],
  },
  {
    id: 'goals',
    title: 'Goals & audience',
    intro: 'What success looks like and who it is for.',
    fields: [
      { name: 'goals', label: 'What should this project achieve?', type: 'textarea' },
      { name: 'audience', label: 'Who is your audience?', type: 'textarea' },
      { name: 'inspiration', label: 'Brands or sites you admire', type: 'textarea', placeholder: 'Links or names, and what you like about them.' },
    ],
  },
  {
    id: 'budget',
    title: 'Budget & timeline',
    intro: 'A range is plenty. It helps me suggest the right scope.',
    fields: [
      { name: 'budget', label: 'Budget range', type: 'radio', required: true, options: ['Under $5k', '$5k – $10k', '$10k – $25k', '$25k – $50k', '$50k+', 'Not sure yet'] },
      { name: 'start', label: 'When would you like to start?', type: 'radio', options: ['As soon as possible', 'Within a month', 'In 1 – 3 months', 'Flexible'] },
      { name: 'deadline', label: 'Hard deadline, if any', type: 'date' },
      { name: 'deadlineReason', label: "What's driving the date?", type: 'text', placeholder: 'A launch, an event, a season…' },
    ],
  },
  {
    id: 'assets',
    title: 'Assets & links',
    intro: 'Share what you already have. Links to Drive, Dropbox or Figma work best.',
    fields: [
      { name: 'existing', label: 'Existing brand', type: 'radio', options: ['Full brand guidelines', 'Logo only', 'Starting fresh'] },
      { name: 'links', label: 'Links to files', type: 'textarea', placeholder: 'One link per line.' },
    ],
  },
  {
    id: 'wrap',
    title: 'Anything else',
    intro: 'Last few details.',
    fields: [
      { name: 'decisionMakers', label: 'Who signs off on the work?', type: 'text', placeholder: 'Names and roles' },
      { name: 'contactPref', label: 'Best way to reach you', type: 'radio', options: ['Email', 'Phone', 'Text'] },
      { name: 'referral', label: 'How did you hear about me?', type: 'select', options: ['Referral', 'LinkedIn', 'Instagram', 'Dribbble', 'Behance', 'Google', 'Other'] },
      { name: 'notes', label: 'Anything else I should know?', type: 'textarea' },
    ],
  },
];

export const FIELDS = SECTIONS.flatMap((s) => s.fields);

const MAX = { textarea: 5000, default: 300 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reads a submitted form against SECTIONS. Unknown fields are dropped and
// option fields only keep listed options, so nothing unexpected is stored.
export function readSubmission(form) {
  const values = {};
  const errors = {};
  for (const f of FIELDS) {
    const max = MAX[f.type] || MAX.default;
    if (f.type === 'checkbox') {
      values[f.name] = form.getAll(f.name).map(String).filter((v) => f.options.includes(v));
    } else {
      let v = String(form.get(f.name) ?? '').trim().slice(0, max);
      if ((f.type === 'radio' || f.type === 'select') && v && !f.options.includes(v)) v = '';
      values[f.name] = v;
    }
    const empty = f.type === 'checkbox' ? !values[f.name].length : !values[f.name];
    if (f.required && empty) errors[f.name] = f.type === 'radio' ? 'Pick one.' : 'Required.';
    else if (f.type === 'email' && values[f.name] && !EMAIL.test(values[f.name])) errors[f.name] = 'Check this email address.';
    else if (f.type === 'date' && values[f.name] && !/^\d{4}-\d{2}-\d{2}$/.test(values[f.name])) values[f.name] = '';
  }
  return { values, errors };
}
