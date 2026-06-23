export const messages = {
  appName: "Draftly",
  metadata: {
    title: "Draftly | Rich Text Editor SaaS",
    description: "A simple SaaS rich text editor with secure accounts, billing, and document management."
  },
  nav: {
    features: "Features",
    pricing: "Pricing",
    security: "Security",
    about: "About",
    contact: "Contact",
    faq: "FAQ",
    login: "Log in",
    register: "Start Writing",
    dashboard: "Dashboard",
    billing: "Billing",
    upgrade: "Upgrade",
    logout: "Log out"
  },
  common: {
    home: "Home"
  },
  landing: {
    heroBadge: "Modern Writing. Powerful ideas.",
    heroTitleTop: "Write Better Content.",
    heroTitleAccent: "Anywhere.",
    heroSubtitle:
      "Draftly is a modern rich text editor for creators, bloggers and teams. Write, format, and organize your ideas with ease.",
    heroPrimaryCta: "Start Writing",
    heroSecondaryCta: "View Pricing",
    heroImageAlt: "Draftly rich text editor shown on a laptop",
    heroHighlights: [
      { title: "Rich Text Editor", description: "Format beautifully with ease" },
      { title: "Image Uploads", description: "Add and manage images seamlessly" },
      { title: "Cloud Storage", description: "Your documents, safe and secure" },
      { title: "Secure & Private", description: "Enterprise-grade security" }
    ],
    featuresTitle: "Everything needed for a useful writing workspace",
    featuresSubtitle: "A deliberately simple MVP with the pieces that matter for a real SaaS launch.",
    features: [
      {
        title: "Rich editing",
        description: "Format headings, lists, quotes, marks, and document structure with a fast TipTap editor."
      },
      {
        title: "Private documents",
        description: "Every document is scoped to its owner and protected by server-side authorization."
      },
      {
        title: "Billing built in",
        description: "Monthly, annual, and lifetime plans run through Stripe Checkout and webhooks."
      }
    ],
    pricingTitle: "Choose the editor access that fits your rhythm",
    pricingSubtitle: "Clear pricing in euros, with the annual plan tuned for the best long-term value.",
    faqTitle: "FAQ for writers",
    faqItems: [
      {
        question: "Is there a free editing plan?",
        answer:
          "No. Draftly does not include a free editing plan. You can create an account, but writing features require an active paid subscription."
      },
      {
        question: "What happens if I stop paying my subscription?",
        answer:
          "Your documents remain in your account. You can still access the dashboard and see your document list, but creating, opening the editor, editing, renaming, deleting, and saving are locked until payment is active again."
      },
      {
        question: "Can I change or cancel my plan anytime?",
        answer:
          "Yes. Monthly and annual plans can be managed from the billing portal. Lifetime is a one-time purchase with no recurring billing."
      },
      {
        question: "Will I lose my texts if a payment fails?",
        answer:
          "No. Your documents stay stored in your account. Once billing is resolved, paid editing access is restored."
      }
    ],
    ctaTitle: "Ready to create your writing workspace?",
    ctaSubtitle: "Create an account, activate a paid plan, and start writing right away.",
    ctaButton: "Create account"
  },
  pricing: {
    monthly: {
      key: "monthly",
      name: "Monthly",
      badge: "Flexible",
      price: "€9.90",
      cadence: "/month",
      note: "Pay as you go",
      description: "Flexible access for regular writing.",
      cta: "Choose monthly",
      features: ["Full TipTap editor", "Unlimited documents", "Cancel anytime"]
    },
    annual: {
      key: "annual",
      name: "Annual",
      badge: "Best value",
      price: "€79",
      cadence: "/year",
      note: "Save €39.80 yearly",
      description: "The best plan for focused writers who use the editor every week.",
      cta: "Choose annual",
      features: ["Full TipTap editor", "Unlimited documents", "Priority product updates"]
    },
    lifetime: {
      key: "lifetime",
      name: "Lifetime",
      badge: "One-time",
      price: "€199",
      cadence: "once",
      note: "Permanent access",
      description: "One payment for permanent access to the writing workspace.",
      cta: "Choose lifetime",
      features: ["Full TipTap editor", "Unlimited documents", "No recurring billing"]
    }
  },
  auth: {
    loginTitle: "Welcome back",
    loginSubtitle: "Log in to continue writing.",
    registerTitle: "Create your account",
    registerSubtitle: "Create your account and activate a paid plan to start writing.",
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordHelp: "Use at least 8 characters.",
    loginButton: "Log in",
    registerButton: "Create account",
    noAccount: "Need an account?",
    hasAccount: "Already have an account?",
    goToRegister: "Register",
    goToLogin: "Log in",
    invalidCredentials: "Email or password is incorrect.",
    emailExists: "An account with this email already exists.",
    invalidEmail: "Enter a valid email address.",
    weakPassword: "Password must be at least 8 characters.",
    genericFailure: "Something went wrong. Please try again."
  },
  dashboard: {
    title: "Documents",
    subtitle: "Create, rename, delete, and open your documents.",
    newDocument: "New document",
    newDocumentNameLabel: "New document name",
    create: "Create",
    cancel: "Cancel",
    emptyTitle: "No documents yet",
    emptyDescription: "Create your first document to set up the workspace.",
    titleColumn: "Title",
    modifiedColumn: "Last modified",
    actionsColumn: "Actions",
    renameLabel: "Document title",
    rename: "Rename",
    saveTitle: "Save title",
    delete: "Delete",
    open: "Open",
    editDocument: "Edit document",
    renameDocument: "Rename document",
    deleteDocument: "Delete document",
    confirmDelete: "Delete this document? This cannot be undone.",
    untitled: "Untitled Document",
    planFree: "No active plan",
    planMonthly: "Monthly",
    planAnnual: "Annual",
    planLifetime: "Lifetime",
    planActive: "Paid access active",
    planPastDue: "Payment needs attention",
    billingSummaryTitle: "Subscription",
    planLabel: "Plan",
    statusLabel: "Status",
    renewsLabel: "Renews",
    statusActive: "Active",
    statusPastDue: "Past due",
    statusCanceled: "Canceled",
    statusFree: "No active plan",
    renewsLifetime: "Lifetime access",
    renewsNone: "Not scheduled",
    upgradeNotice:
      "Without an active paid plan, you can only access your dashboard list. Upgrade to create, open, edit, save, rename, and delete documents.",
    upgradeButton: "Upgrade",
    createRequiresUpgrade: "Upgrade to create documents",
    billingPortalError: "Billing management is temporarily unavailable. Please try again in a moment."
  },
  editor: {
    backToDashboard: "Back to dashboard",
    save: "Save",
    saveNow: "Save now",
    saving: "Saving",
    saved: "Saved",
    saveFailed: "Save failed",
    dirty: "Unsaved changes",
    autosaving: "Autosaving...",
    words: "Words",
    characters: "Characters",
    bold: "Bold",
    italic: "Italic",
    strike: "Strike",
    underline: "Underline",
    highlight: "Highlight",
    clearHighlight: "Clear highlight",
    clearTextColor: "Clear text color",
    link: "Link",
    linkUrl: "Link URL",
    applyLink: "Apply link",
    removeLink: "Remove link",
    image: "Insert image",
    imageSmall: "Small image",
    imageMedium: "Medium image",
    imageLarge: "Large image",
    imageFull: "Full width image",
    imageAlignLeft: "Align image left",
    imageAlignCenter: "Align image center",
    imageAlignRight: "Align image right",
    imageUploading: "Uploading image",
    imageUploadFailed: "Image upload failed",
    alignLeft: "Align left",
    alignCenter: "Align center",
    alignRight: "Align right",
    bulletList: "Bullet list",
    orderedList: "Ordered list",
    quote: "Quote",
    undo: "Undo",
    redo: "Redo",
    paragraph: "Paragraph",
    heading: "Heading",
    codeBlock: "Code block"
  },
  upgrade: {
    title: "Upgrade to edit documents",
    subtitle: "Paid access unlocks the editor and saving for every document in your workspace.",
    currentPlan: "Current plan",
    checkoutError: "Checkout could not be started. Check the Stripe configuration and try again."
  },
  billing: {
    successTitle: "Billing confirmed",
    successSubtitle: "Your account now has editor access.",
    pendingTitle: "Payment is still processing",
    pendingSubtitle: "Stripe has not confirmed access yet. Refresh this page in a moment.",
    canceledTitle: "Checkout canceled",
    canceledSubtitle: "No changes were made to your account.",
    dashboardButton: "Go to dashboard",
    upgradeButton: "Back to upgrade"
  },
  errors: {
    unauthorized: "You must be logged in to continue.",
    forbidden: "You do not have access to this resource.",
    notFound: "The requested resource was not found.",
    invalidInput: "The submitted data is invalid.",
    internal: "Something went wrong.",
    paidAccessRequired: "A paid plan is required to edit documents.",
    invalidImage: "Upload a valid image file.",
    invalidImageType: "Images must be JPG, PNG, WebP, or GIF.",
    invalidImageSize: "Images must be smaller than 5 MB.",
    stripeNotConfigured: "Stripe is not configured.",
    planNotConfigured: "The selected plan is not configured.",
    invalidPlan: "The selected plan is invalid.",
    invalidWebhook: "Stripe webhook verification failed."
  }
} as const;

export type Messages = typeof messages;
