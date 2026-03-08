import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'fr';

const translations = {
  ar: {
    // Header
    appTitle: 'نظام إدارة المخزون',
    appSubtitle: 'تتبع الطلبات والكميات بسهولة',
    logout: 'خروج',
    settings: 'الإعدادات',
    language: 'اللغة',
    arabic: 'العربية',
    french: 'الفرنسية',

    // Stats
    totalProducts: 'إجمالي المنتجات',
    totalQuantity: 'إجمالي الكميات',
    totalSurface: 'إجمالي المساحة',
    inMovements: 'حركات الإدخال',
    outMovements: 'حركات الإخراج',
    product: 'منتج',
    unit: 'وحدة',
    operation: 'عملية',

    // Product Table
    productList: 'قائمة المنتجات',
    searchProduct: 'بحث عن منتج...',
    noProducts: 'لا توجد منتجات',
    noSearchResults: 'لم يتم العثور على منتجات تطابق البحث',
    startAdding: 'ابدأ بإضافة منتج جديد',
    designation: 'التسمية',
    type: 'النوع',
    color: 'اللون',
    thickness: 'السمك',
    unitCol: 'الوحدة',
    quantity: 'الكمية',
    length: 'الطول',
    width: 'العرض',
    surface: 'المساحة',
    actions: 'الإجراءات',
    mm: 'مم',
    m: 'م',
    m2: 'م²',

    // Product Form
    addNewProduct: 'إضافة منتج جديد',
    designationLabel: 'التسمية *',
    designationPlaceholder: 'مثال: PS Couverture TI70mm',
    typeLabel: 'النوع *',
    selectType: 'اختر النوع',
    colorLabel: 'اللون',
    selectColor: 'اختر اللون',
    thicknessLabel: 'السمك (مم)',
    unitLabel: 'الوحدة',
    selectUnit: 'اختر الوحدة',
    quantityLabel: 'الكمية',
    lengthLabel: 'الطول (م)',
    widthLabel: 'العرض (م)',
    calculatedSurface: 'المساحة المحسوبة',
    cancel: 'إلغاء',
    addProduct: 'إضافة المنتج',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
    productAdded: 'تمت إضافة المنتج بنجاح',
    productDeleted: 'تم حذف المنتج بنجاح',

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
    noMovementsDesc: 'لم يتم تسجيل أي حركات لهذا المنتج بعد',
    movementType: 'النوع',
    date: 'التاريخ',
    in: 'إدخال',
    out: 'إخراج',

    // Delete
    areYouSure: 'هل أنت متأكد؟',
    deleteConfirm: 'سيتم حذف المنتج نهائياً مع جميع حركات المخزون المرتبطة به.',
    delete: 'حذف',

    // Export
    exportSuccess: 'تم تصدير الملف بنجاح',
    exportFail: 'فشل تصدير الملف',

    // Auth
    inventorySystem: 'نظام المخزون',
    authSubtitle: 'إدارة مخزونك بذكاء وسهولة',
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
    footer: 'نظام إدارة المخزون',
    loading: 'جارٍ التحميل...',
  },
  fr: {
    appTitle: 'Système de Gestion de Stock',
    appSubtitle: 'Suivi des commandes et quantités facilement',
    logout: 'Déconnexion',
    settings: 'Paramètres',
    language: 'Langue',
    arabic: 'Arabe',
    french: 'Français',

    totalProducts: 'Total Produits',
    totalQuantity: 'Total Quantités',
    totalSurface: 'Surface Totale',
    inMovements: 'Entrées',
    outMovements: 'Sorties',
    product: 'produit',
    unit: 'unité',
    operation: 'opération',

    productList: 'Liste des Produits',
    searchProduct: 'Rechercher un produit...',
    noProducts: 'Aucun produit',
    noSearchResults: 'Aucun produit ne correspond à la recherche',
    startAdding: 'Commencez par ajouter un nouveau produit',
    designation: 'Désignation',
    type: 'Type',
    color: 'Couleur',
    thickness: 'Épaisseur',
    unitCol: 'Unité',
    quantity: 'Quantité',
    length: 'Longueur',
    width: 'Largeur',
    surface: 'Surface',
    actions: 'Actions',
    mm: 'mm',
    m: 'm',
    m2: 'm²',

    addNewProduct: 'Ajouter un nouveau produit',
    designationLabel: 'Désignation *',
    designationPlaceholder: 'Ex: PS Couverture TI70mm',
    typeLabel: 'Type *',
    selectType: 'Choisir le type',
    colorLabel: 'Couleur',
    selectColor: 'Choisir la couleur',
    thicknessLabel: 'Épaisseur (mm)',
    unitLabel: 'Unité',
    selectUnit: 'Choisir l\'unité',
    quantityLabel: 'Quantité',
    lengthLabel: 'Longueur (m)',
    widthLabel: 'Largeur (m)',
    calculatedSurface: 'Surface calculée',
    cancel: 'Annuler',
    addProduct: 'Ajouter le produit',
    fillRequired: 'Veuillez remplir tous les champs obligatoires',
    productAdded: 'Produit ajouté avec succès',
    productDeleted: 'Produit supprimé avec succès',

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
    noMovementsDesc: 'Aucun mouvement enregistré pour ce produit',
    movementType: 'Type',
    date: 'Date',
    in: 'Entrée',
    out: 'Sortie',

    areYouSure: 'Êtes-vous sûr ?',
    deleteConfirm: 'Le produit sera supprimé définitivement avec tous les mouvements associés.',
    delete: 'Supprimer',

    exportSuccess: 'Fichier exporté avec succès',
    exportFail: 'Échec de l\'exportation',

    inventorySystem: 'Système de Stock',
    authSubtitle: 'Gérez votre inventaire intelligemment',
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

    footer: 'Système de Gestion de Stock',
    loading: 'Chargement...',
  },
} as const;

type Translations = typeof translations.ar;

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
