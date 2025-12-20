"use client";

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Palette, Users2, ListOrdered, Landmark, Compass,
    Settings, Sun, Link, Moon, Utensils, Globe, Plus, Edit, X, Download, Upload, RotateCcw,
    Cloud, CloudRain, CloudLightning, Snowflake, Wind
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { marked } from 'marked';

interface CustomLink {
    id: string;
    name: string;
    url: string;
    icon?: string;
}

interface PresetLink {
    href: string;
    icon: React.ComponentType<{ className?: string }> | null;
    text: string;
    image?: string;
    external?: boolean;
    className?: string;
}

const PRESET_LINKS: PresetLink[] = [
    { href: '/syofficial', icon: CheckCircle2, text: 'الحسابات الرسمية' },
    { href: '/syid', icon: Palette, text: 'الهوية البصرية' },
    { href: '/party', icon: Users2, text: 'دليل الأحزاب' },
    { href: '/tierlist', icon: ListOrdered, text: 'تقييم الحكومة' },
    { href: '/house', icon: Landmark, text: 'المجلس التشريعي' },
    { href: '/compass', icon: Compass, text: 'البوصلة السياسية' },
    { href: '/sites', icon: Link, text: 'دليل المواقع' },
    { href: '/population', icon: Globe, text: 'أطلس' },
    { href: 'https://food.syrian.zone', icon: Utensils, text: 'وصفاتنا' },
    { href: 'https://github.com/SYCompass/Twitter-SVG-Syrian-Flag-Replacer/releases/tag/1.0.1', icon: null, text: 'مبدل العلم', image: '/flag-replacer/1f1f8-1f1fe.svg', external: true },
    { href: 'https://wrraq.com', icon: null, text: 'المنتدى', image: '/assets/wrraq.png', external: true },
    { href: 'https://syrevarch.com/', icon: null, text: 'أرشيف الثورة', image: '/assets/syrevarchive.webp', external: true },
];


const GOVERNORATES: Record<string, { lat: number; lon: number }> = {
    'damascus': { lat: 33.5138, lon: 36.2765 },
    'aleppo': { lat: 36.2021, lon: 37.1343 },
    'homs': { lat: 34.7324, lon: 36.7137 },
    'hama': { lat: 35.1318, lon: 36.7578 },
    'latakia': { lat: 35.5317, lon: 35.7901 },
    'tartus': { lat: 34.8890, lon: 35.8866 },
    'deir-ez-zor': { lat: 35.3359, lon: 40.1408 },
    'idlib': { lat: 35.9306, lon: 36.6339 },
    'daraa': { lat: 32.6255, lon: 36.1016 },
    'quneitra': { lat: 33.1250, lon: 35.8250 },
    'sweida': { lat: 32.7089, lon: 36.5695 },
    'rural-damascus': { lat: 33.5138, lon: 36.2765 },
    'hasakah': { lat: 36.5023, lon: 40.7382 },
    'raqqa': { lat: 35.9520, lon: 39.0081 },
};

const WEATHER_TRANSLATIONS: Record<string, string> = {
    "clear sky": "سماء صافية",
    "few clouds": "غيوم قليلة",
    "scattered clouds": "غيوم متفرقة",
    "broken clouds": "غيوم جزئية",
    "shower rain": "مطر غزير",
    "rain": "ممطر",
    "thunderstorm": "عاصفة رعدية",
    "snow": "مثلج",
    "mist": "ضباب",
    "overcast clouds": "غيوم ملبدة",
    "light rain": "مطر خفيف",
    "moderate rain": "مطر متوسط",
};

export default function HomeClient({ aboutContent = '' }: { aboutContent?: string }) {
    const [aboutHtml, setAboutHtml] = useState('');

    useEffect(() => {
        const parseContent = async () => {
            if (aboutContent) {
                const html = await marked.parse(aboutContent);
                setAboutHtml(html);
            }
        };
        parseContent();
    }, [aboutContent]);

    const [theme, setTheme] = useState<string | null>(null);
    const [language, setLanguage] = useState<'ar' | 'en' | null>(null);
    const [searchEngine, setSearchEngine] = useState('duckduckgo');
    const [searchQuery, setSearchQuery] = useState('');
    const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [addLinkOpen, setAddLinkOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Weather & Clock state
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [weather, setWeather] = useState<any>(null);
    const [governorate, setGovernorate] = useState('damascus');
    const [clockFormat, setClockFormat] = useState<'12' | '24'>('24');

    const THEMES = ['light', 'dark', 'dark-blue', 'dark-purple', 'dark-green', 'high-contrast'];

    // Load settings from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('sz-theme') || 'dark';
        const savedLang = localStorage.getItem('sz-language') as 'ar' | 'en' || 'ar';
        const savedLinks = localStorage.getItem('customLinks');
        const savedGovernorate = localStorage.getItem('governorate') || 'damascus';
        const savedClockFormat = localStorage.getItem('clockFormat') as '12' | '24' || '24';

        setTheme(savedTheme);
        setLanguage(savedLang);
        setGovernorate(savedGovernorate);
        setClockFormat(savedClockFormat);

        if (savedLinks) {
            try {
                setCustomLinks(JSON.parse(savedLinks));
            } catch (e) {
                console.error('Failed to parse custom links', e);
            }
        }

        // Apply theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        setMounted(true);
        setCurrentTime(new Date());
    }, []);

    // Clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getWeatherIcon = (iconCode: string) => {
        if (iconCode.startsWith('01')) return <Sun className="w-8 h-8 text-yellow-500" />;
        if (iconCode.startsWith('02')) return <Sun className="w-8 h-8 text-orange-400" />;
        if (iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud className="w-8 h-8 text-gray-400" />;
        if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain className="w-8 h-8 text-blue-400" />;
        if (iconCode.startsWith('11')) return <CloudLightning className="w-8 h-8 text-purple-500" />;
        if (iconCode.startsWith('13')) return <Snowflake className="w-8 h-8 text-white" />;
        if (iconCode.startsWith('50')) return <Wind className="w-8 h-8 text-gray-300" />;
        return <Sun className="w-8 h-8 text-yellow-500" />;
    };

    // Fetch weather
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const coords = GOVERNORATES[governorate] || GOVERNORATES['damascus'];
                const response = await fetch(`https://syrianzone.hade-alahmad1.workers.dev/?lat=${coords.lat}&lon=${coords.lon}`);
                if (!response.ok) throw new Error('Weather fetch failed');
                const data = await response.json();

                let description = data.weather[0].description;
                if (language === 'ar' && WEATHER_TRANSLATIONS[description]) {
                    description = WEATHER_TRANSLATIONS[description];
                }

                setWeather({
                    temp: Math.round(data.main.temp),
                    description: description,
                    icon: getWeatherIcon(data.weather[0].icon)
                });
            } catch (e) {
                console.error(e);
                setWeather(null);
            }
        };

        if (mounted) {
            fetchWeather();
        }
    }, [governorate, language, mounted]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        const searchUrls: Record<string, string> = {
            duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`,
            google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
            bing: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery)}`,
            searx: `https://searx.be/search?q=${encodeURIComponent(searchQuery)}`,
        };

        const url = searchUrls[searchEngine] || searchUrls.duckduckgo;
        window.open(url, '_blank');
        setSearchQuery('');
    };

    const cycleTheme = () => {
        const currentTheme = theme || 'dark';
        const currentIndex = THEMES.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        const newTheme = THEMES[nextIndex];
        setTheme(newTheme);
        localStorage.setItem('sz-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleLanguage = () => {
        const newLang = language === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
        localStorage.setItem('sz-language', newLang);
    };

    const addCustomLink = (link: CustomLink) => {
        const updated = [...customLinks, link];
        setCustomLinks(updated);
        localStorage.setItem('customLinks', JSON.stringify(updated));
    };

    const removeCustomLink = (id: string) => {
        const updated = customLinks.filter(l => l.id !== id);
        setCustomLinks(updated);
        localStorage.setItem('customLinks', JSON.stringify(updated));
    };

    const formatTime = (date: Date | null) => {
        if (!date) return "--:--:--";
        if (clockFormat === '12') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        }
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "";
        return date.toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!mounted) return null;

    const currentLang = language || 'ar';

    return (
        <div className="min-h-screen text-foreground transition-colors" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Top Controls */}
            <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
                <Button variant="ghost" size="sm" onClick={() => setAboutOpen(true)}>
                    {currentLang === 'ar' ? 'حول' : 'About'}
                </Button>

                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleLanguage}>
                        <img src={`/assets/${currentLang}.svg`} alt={currentLang} className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={cycleTheme}>
                        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pt-20 pb-12 max-w-6xl">
                {/* Weather & Clock */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    {/* Weather Widget */}
                    <Card className="w-full md:w-auto bg-card/50 backdrop-blur-sm border-border">
                        <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground">
                                {weather ? (
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{weather.icon}</span>
                                        <div>
                                            <div className="font-semibold text-foreground">{weather.temp}°C</div>
                                            <div className="text-xs">{weather.description}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-pulse">Loading weather...</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clock */}
                    <div className="text-center">
                        <div className="text-4xl md:text-6xl font-bold text-foreground mb-2">
                            {formatTime(currentTime)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {formatDate(currentTime)}
                        </div>
                    </div>

                    <div className="w-full md:w-auto opacity-0 md:opacity-100">
                        {/* Spacer for symmetry */}
                        <div className="w-32 h-16"></div>
                    </div>
                </div>

                {/* Logo */}
                <div className="flex justify-center mb-12">
                    {mounted && (
                        <img
                            src={theme === 'light' ? '/assets/logo-lightmode.svg' : '/assets/logo-darkmode.svg'}
                            alt="Syrian Zone"
                            className="h-16 md:h-24"
                        />
                    )}
                </div>

                {/* Search */}
                <div className="max-w-3xl mx-auto mb-16">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Select value={searchEngine} onValueChange={setSearchEngine}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                                <SelectItem value="searx">SearX</SelectItem>
                                <SelectItem value="google">Google</SelectItem>
                                <SelectItem value="bing">Bing</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={currentLang === 'ar' ? 'ابحث في الويب...' : 'Search the web...'}
                            className="flex-1"
                        />
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {currentLang === 'ar' ? 'بحث' : 'Search'}
                        </Button>
                    </form>
                </div>

                {/* Quick Links */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-foreground mb-6 text-center">
                        {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {PRESET_LINKS.map((link, idx) => {
                            const Icon = link.icon;
                            return (
                                <a
                                    key={idx}
                                    href={link.href}
                                    target={link.external ? '_blank' : undefined}
                                    rel={link.external ? 'noopener noreferrer' : undefined}
                                    className="group"
                                >
                                    <Card className="h-full hover:shadow-lg transition-all border-border bg-card">
                                        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                            {Icon && <Icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />}
                                            {link.image && <img src={link.image} alt={link.text} className="w-7 h-7 group-hover:scale-110 transition-transform" />}
                                            {link.className && <div className={link.className} style={{ width: '1.8rem', height: '1.8rem' }}></div>}
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                {link.text}
                                            </span>
                                        </CardContent>
                                    </Card>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Links */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-foreground">
                            {language === 'ar' ? 'روابط مخصصة' : 'Custom Links'}
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditMode(!editMode)}
                                className="bg-muted text-foreground border-border hover:bg-accent"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAddLinkOpen(true)}
                                className="bg-muted text-foreground border-border hover:bg-accent"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {language === 'ar' ? 'إضافة' : 'Add'}
                            </Button>
                        </div>
                    </div>

                    {customLinks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {customLinks.map((link) => (
                                <div key={link.id} className="relative group">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                        <Card className="h-full hover:shadow-lg transition-all border-border bg-card">
                                            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                                                {link.icon && <span className="text-2xl">{link.icon}</span>}
                                                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                    {link.name}
                                                </span>
                                            </CardContent>
                                        </Card>
                                    </a>
                                    {editMode && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeCustomLink(link.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Card className="border-dashed border-2 border-border bg-transparent">
                            <CardContent className="p-12 text-center">
                                <p className="text-muted-foreground mb-4">
                                    {language === 'ar' ? 'لا توجد روابط مخصصة' : 'No custom links yet'}
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setAddLinkOpen(true)}
                                    className="bg-muted text-foreground border-border hover:bg-accent"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'إضافة رابط' : 'Add Link'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentLang === 'ar' ? 'الإعدادات' : 'Settings'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Weather Settings */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">
                                {currentLang === 'ar' ? 'إعدادات الطقس' : 'Weather Settings'}
                            </h4>
                            <div className="space-y-2">
                                <Label>{currentLang === 'ar' ? 'المحافظة' : 'Governorate'}</Label>
                                <Select value={governorate} onValueChange={setGovernorate}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="damascus">Damascus</SelectItem>
                                        <SelectItem value="aleppo">Aleppo</SelectItem>
                                        <SelectItem value="homs">Homs</SelectItem>
                                        <SelectItem value="hama">Hama</SelectItem>
                                        <SelectItem value="latakia">Latakia</SelectItem>
                                        <SelectItem value="tartus">Tartus</SelectItem>
                                        <SelectItem value="deir-ez-zor">Deir ez-Zor</SelectItem>
                                        <SelectItem value="idlib">Idlib</SelectItem>
                                        <SelectItem value="daraa">Daraa</SelectItem>
                                        <SelectItem value="quneitra">Quneitra</SelectItem>
                                        <SelectItem value="sweida">Sweida</SelectItem>
                                        <SelectItem value="rural-damascus">Rural Damascus</SelectItem>
                                        <SelectItem value="hasakah">Hasakah</SelectItem>
                                        <SelectItem value="raqqa">Raqqa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Clock Settings */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">
                                {currentLang === 'ar' ? 'إعدادات الساعة' : 'Clock Settings'}
                            </h4>
                            <div className="space-y-2">
                                <Label>{currentLang === 'ar' ? 'تنسيق الوقت' : 'Time Format'}</Label>
                                <Select value={clockFormat} onValueChange={(val: '12' | '24') => {
                                    setClockFormat(val);
                                    localStorage.setItem('clockFormat', val);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="12">12 Hour</SelectItem>
                                        <SelectItem value="24">24 Hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Theme Settings */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-foreground">
                                {currentLang === 'ar' ? 'إعدادات المظهر' : 'Theme Settings'}
                            </h4>
                            <div className="space-y-2">
                                <Label>{currentLang === 'ar' ? 'اللغة' : 'Language'}</Label>
                                <Select value={currentLang} onValueChange={(val: 'ar' | 'en') => {
                                    setLanguage(val);
                                    localStorage.setItem('sz-language', val);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="ar">العربية</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{currentLang === 'ar' ? 'المظهر' : 'Theme'}</Label>
                                <Select value={theme || 'dark'} onValueChange={(val) => {
                                    setTheme(val);
                                    localStorage.setItem('sz-theme', val);
                                    document.documentElement.setAttribute('data-theme', val);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="dark-blue">Dark Blue</SelectItem>
                                        <SelectItem value="dark-purple">Dark Purple</SelectItem>
                                        <SelectItem value="dark-green">Dark Green</SelectItem>
                                        <SelectItem value="high-contrast">High Contrast</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Link Dialog */}
            <AddLinkDialog
                open={addLinkOpen}
                onOpenChange={setAddLinkOpen}
                onAdd={addCustomLink}
                language={currentLang}
            />

            {/* About Dialog */}
            <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{currentLang === 'ar' ? 'حول Syrian Zone' : 'About Syrian Zone'}</DialogTitle>
                    </DialogHeader>
                    <div
                        className="py-4 space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-2 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&_a]:text-primary [&_a]:underline"
                        dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
                        dangerouslySetInnerHTML={{ __html: aboutHtml || (currentLang === 'ar' ? 'جاري التحميل...' : 'Loading...') }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Add Link Dialog Component
function AddLinkDialog({
    open,
    onOpenChange,
    onAdd,
    language
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (link: CustomLink) => void;
    language: 'ar' | 'en';
}) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [icon, setIcon] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !url) return;

        onAdd({
            id: Date.now().toString(),
            name,
            url,
            icon: icon || '🔗'
        });

        setName('');
        setUrl('');
        setIcon('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'إضافة رابط مخصص' : 'Add Custom Link'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={language === 'ar' ? 'اسم الرابط' : 'Link name'}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'الرابط' : 'URL'}</Label>
                        <Input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{language === 'ar' ? 'أيقونة (اختياري)' : 'Icon (optional)'}</Label>
                        <Input
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            placeholder="🔗"
                            maxLength={2}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {language === 'ar' ? 'حفظ' : 'Save'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
