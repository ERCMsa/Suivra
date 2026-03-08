import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'fr';

const translations = {
  ar: {
    // Header
    appTitle: 'نظام تتبع المواد',
    appSubtitle: 'تتبع المعدات والمستهلكات والمواد',
    logout: 'خروج',
    settings: 'الإعدادات',
    language: 'اللغة',
    arabic: 'العربية',
    french: 'الفرنسية',

    // Stats
    totalProducts: 'إجمالي المواد',
    totalQuantity: 'إجمالي الكميات',
    totalSurface: 'القيمة الإجمالية',
    inMovements: 'حركات الإدخال',
    outMovements: 'حركات الإخراج',
    product: 'مادة',
    unit: 'وحدة',
    operation: 'عملية',

    // Product Table
    productList: 'قائمة المواد',
    searchProduct: 'بحث عن مادة...',
    noProducts: 'لا توجد مواد',
    noSearchResults: 'لم يتم العثور على مواد تطابق البحث',
    startAdding: 'ابدأ بإضافة مادة جديدة',
    designation: 'التسمية',
    type: 'الفئة',
    color: 'الحالة',
    thickness: 'المرجع',
    unitCol: 'الوحدة',
    quantity: 'الكمية',
    length: 'الموقع',
    width: 'المورد',
    surface: 'ملاحظات',
    actions: 'الإجراءات',
    mm: '',
    m: '',
    m2: '',

    // Product Form
    addNewProduct: 'إضافة مادة جديدة',
    designationLabel: 'التسمية *',
    designationPlaceholder: 'مثال: قفازات أمان، مثقاب كهربائي...',
    typeLabel: 'الفئة *',
    selectType: 'اختر الفئة',
    colorLabel: 'الحالة',
    selectColor: 'اختر الحالة',
    thicknessLabel: 'الرقم المرجعي',
    unitLabel: 'الوحدة',
    selectUnit: 'اختر الوحدة',
    quantityLabel: 'الكمية',
    lengthLabel: 'الموقع',
    widthLabel: 'المورد',
    calculatedSurface: 'ملخص',
    cancel: 'إلغاء',
    addProduct: 'إضافة المادة',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
    productAdded: 'تمت إضافة المادة بنجاح',
    productDeleted: 'تم حذف المادة بنجاح',

    // Stock Movement
    addQuantity: 'إدخال كمية',
    removeQuantity: 'إخراج كمية',
    currentStock: 'المخزون الحالي',
    notes: 'ملاحظات',
    notesPlaceholder: 'ملاحظات إضافية (اختياري)',
    submit: 'إدخال',
    submitOut: 'إخراج',
    quantityAdded: 'تم إدخال الكمية بنجاح',
    quantityRemoved: 'تم إخراج الكمية بنجاح',
    quantityMustBePositive: 'يجب أن تكون الكمية أكبر من صفر',
    insufficientStock: 'الكمية المطلوبة أكبر من المخزون المتاح',

    // Movement History
    movementHistory: 'سجل الحركات',
    noMovements: 'لا توجد حركات',
    noMovementsDesc: 'لم يتم تسجيل أي حركات لهذه المادة بعد',
    movementType: 'النوع',
    date: 'التاريخ',
    in: 'إدخال',
    out: 'إخراج',

    // Delete
    areYouSure: 'هل أنت متأكد؟',
    deleteConfirm: 'سيتم حذف هذه المادة نهائياً مع جميع حركات المخزون المرتبطة بها.',
    delete: 'حذف',

    // Export
    exportSuccess: 'تم تصدير الملف بنجاح',
    exportFail: 'فشل تصدير الملف',

    // Auth
    inventorySystem: 'نظام تتبع المواد',
    authSubtitle: 'إدارة المعدات والمستهلكات بسهولة',
    login: 'تسجيل الدخول',
    newAccount: 'حساب جديد',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    loggingIn: 'جارٍ تسجيل الدخول...',
    creatingAccount: 'جارٍ إنشاء الحساب...',
    createAccount: 'إنشاء حساب',
    or: 'أو',
    loginWithGoogle: 'تسجيل الدخول بحساب Google',
    signupWithGoogle: 'التسجيل بحساب Google',
    googleFail: 'فشل تسجيل الدخول بحساب Google',
    signingWithGoogle: 'جارٍ التسجيل...',
    accountCreated: 'تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني للتأكيد.',

    // Footer
    footer: 'نظام تتبع المواد - ERCM SA',
    loading: 'جارٍ التحميل...',
  },
  fr: {
    appTitle: 'Suivi du Matériel',
    appSubtitle: 'Suivi des équipements, consommables et matériaux',
    logout: 'Déconnexion',
    settings: 'Paramètres',
    language: 'Langue',
    arabic: 'Arabe',
    french: 'Français',

    totalProducts: 'Total Articles',
    totalQuantity: 'Total Quantités',
    totalSurface: 'Valeur Totale',
    inMovements: 'Entrées',
    outMovements: 'Sorties',
    product: 'article',
    unit: 'unité',
    operation: 'opération',

    productList: 'Liste du Matériel',
    searchProduct: 'Rechercher un article...',
    noProducts: 'Aucun article',
    noSearchResults: 'Aucun article ne correspond à la recherche',
    startAdding: 'Commencez par ajouter un nouvel article',
    designation: 'Désignation',
    type: 'Catégorie',
    color: 'État',
    thickness: 'Référence',
    unitCol: 'Unité',
    quantity: 'Quantité',
    length: 'Emplacement',
    width: 'Fournisseur',
    surface: 'Remarques',
    actions: 'Actions',
    mm: '',
    m: '',
    m2: '',

    addNewProduct: 'Ajouter un nouvel article',
    designationLabel: 'Désignation *',
    designationPlaceholder: 'Ex: Gants de sécurité, Perceuse électrique...',
    typeLabel: 'Catégorie *',
    selectType: 'Choisir la catégorie',
    colorLabel: 'État',
    selectColor: 'Choisir l\'état',
    thicknessLabel: 'Référence',
    unitLabel: 'Unité',
    selectUnit: 'Choisir l\'unité',
    quantityLabel: 'Quantité',
    lengthLabel: 'Emplacement',
    widthLabel: 'Fournisseur',
    calculatedSurface: 'Résumé',
    cancel: 'Annuler',
    addProduct: 'Ajouter l\'article',
    fillRequired: 'Veuillez remplir tous les champs obligatoires',
    productAdded: 'Article ajouté avec succès',
    productDeleted: 'Article supprimé avec succès',

    addQuantity: 'Entrée de stock',
    removeQuantity: 'Sortie de stock',
    currentStock: 'Stock actuel',
    notes: 'Notes',
    notesPlaceholder: 'Notes supplémentaires (optionnel)',
    submit: 'Entrée',
    submitOut: 'Sortie',
    quantityAdded: 'Quantité ajoutée avec succès',
    quantityRemoved: 'Quantité retirée avec succès',
    quantityMustBePositive: 'La quantité doit être supérieure à zéro',
    insufficientStock: 'Quantité demandée supérieure au stock disponible',

    movementHistory: 'Historique des mouvements',
    noMovements: 'Aucun mouvement',
    noMovementsDesc: 'Aucun mouvement enregistré pour cet article',
    movementType: 'Type',
    date: 'Date',
    in: 'Entrée',
    out: 'Sortie',

    areYouSure: 'Êtes-vous sûr ?',
    deleteConfirm: 'L\'article sera supprimé définitivement avec tous les mouvements associés.',
    delete: 'Supprimer',

    exportSuccess: 'Fichier exporté avec succès',
    exportFail: 'Échec de l\'exportation',

    inventorySystem: 'Suivi du Matériel',
    authSubtitle: 'Gérez vos équipements et consommables facilement',
    login: 'Connexion',
    newAccount: 'Nouveau compte',
    email: 'Email',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    loggingIn: 'Connexion en cours...',
    creatingAccount: 'Création du compte...',
    createAccount: 'Créer un compte',
    or: 'ou',
    loginWithGoogle: 'Se connecter avec Google',
    signupWithGoogle: 'S\'inscrire avec Google',
    googleFail: 'Échec de la connexion Google',
    signingWithGoogle: 'Connexion en cours...',
    accountCreated: 'Compte créé ! Vérifiez votre email pour confirmer.',

    footer: 'Suivi du Matériel - ERCM SA',
    loading: 'Chargement...',
  },
} as const;

type Translations = Record<keyof typeof translations.ar, string>;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'fr' || saved === 'ar') ? saved : 'ar';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('app-language', newLang);
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const value: LanguageContextType = {
    lang,
    setLang,
    t: translations[lang],
    dir: lang === 'ar' ? 'rtl' : 'ltr',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
