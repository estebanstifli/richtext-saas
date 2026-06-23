export const messages = {
  appName: "Draftly",
  metadata: {
    title: "Draftly | Rich Text Editor SaaS",
    description: "A simple SaaS rich text editor with secure accounts, billing, and document management."
  },
  nav: {
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    login: "Log in",
    register: "Start writing",
    dashboard: "Dashboard",
    billing: "Billing",
    upgrade: "Upgrade",
    logout: "Log out"
  },
  common: {
    home: "Home"
  },
  landing: {
    heroEyebrow: "Rich text editing for focused teams",
    heroTitle: "Write, manage, and ship polished documents from one clean workspace.",
    heroSubtitle:
      "Draftly combines a TipTap-powered editor, secure accounts, Stripe billing, and lightweight document management in a production-ready SaaS foundation.",
    heroPrimaryCta: "Start free",
    heroSecondaryCta: "View pricing",
    preview: {
      documents: ["Launch brief", "Meeting notes", "Editorial plan"],
      toolbar: ["B", "I", "H1", "List"]
    },
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
    faqTitle: "Questions",
    faqItems: [
      {
        question: "Can I use Draftly without paying?",
        answer: "Yes. You can register and view the upgrade path, but document creation and editing require an active paid plan."
      },
      {
        question: "Does Draftly use external authentication providers?",
        answer: "No. Authentication is handled with email, password hashing, and secure HttpOnly session cookies."
      },
      {
        question: "What happens if a Stripe webhook is delayed?",
        answer: "The billing success page validates the Checkout Session directly with Stripe before unlocking access."
      },
      {
        question: "Is this built for teams?",
        answer: "No. This MVP intentionally supports single-user accounts only."
      }
    ],
    ctaTitle: "Ready to create your writing workspace?",
    ctaSubtitle: "Create an account, choose a plan when you are ready, and start editing.",
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
    registerSubtitle: "Start with document management for free.",
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
    planFree: "Free",
    planActive: "Paid access active",
    planPastDue: "Payment needs attention",
    upgradeNotice: "Upgrade to create, edit, save, rename, and delete documents.",
    upgradeButton: "Upgrade",
    createRequiresUpgrade: "Upgrade to create",
    billingPortalError: "Billing management is temporarily unavailable. Please try again in a moment."
  },
  editor: {
    backToDashboard: "Back to dashboard",
    save: "Save",
    saving: "Saving",
    saved: "Saved",
    saveFailed: "Save failed",
    dirty: "Unsaved changes",
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
