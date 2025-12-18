"use client";

import React, { useState } from 'react';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Wallpaper {
    title: string;
    imageSrc: string;
    downloadJpg?: string;
    downloadPng?: string;
    downloadSvg?: string;
    designerName?: string;
    designerLink?: string;
}

interface SyidClientProps {
    wallpapers: Wallpaper[];
}

// Color palettes from the official Syrian identity
const COLOR_PALETTES = [
    {
        name: 'Forest',
        colors: [
            { hex: '#428177', cmyk: 'C76% M32% Y54% K10%', textColor: 'white' },
            { hex: '#054239', cmyk: 'C89% M49% Y70% K50%', textColor: 'white' },
            { hex: '#002623', cmyk: 'C87% M59% Y68% K71%', textColor: 'white' },
        ]
    },
    {
        name: 'Golden Wheat',
        colors: [
            { hex: '#edebe0', cmyk: 'C6% M9% Y19% K0%', textColor: 'black' },
            { hex: '#b9a779', cmyk: 'C20% M29% Y52% K7%', textColor: 'black' },
            { hex: '#988561', cmyk: 'C39% M46% Y67% K20%', textColor: 'white' },
        ]
    },
    {
        name: 'Deep Umber',
        colors: [
            { hex: '#6b1f2a', cmyk: 'C35% M92% Y72% K46%', textColor: 'white' },
            { hex: '#4a151e', cmyk: 'C44% M86% Y68% K65%', textColor: 'white' },
            { hex: '#260f14', cmyk: 'C60% M75% Y64% K79%', textColor: 'white' },
        ]
    },
    {
        name: 'Charcoal',
        colors: [
            { hex: '#ffffff', cmyk: 'C0% M0% Y0% K0%', textColor: 'black' },
            { hex: '#3d3a3b', cmyk: 'C67% M53% Y60% K50%', textColor: 'white' },
            { hex: '#161616', cmyk: 'C73% M67% Y65% K80%', textColor: 'white' },
        ]
    },
];

export default function SyidClient({ wallpapers }: SyidClientProps) {
    const [copiedColor, setCopiedColor] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    const copyToClipboard = (text: string, colorHex: string) => {
        navigator.clipboard.writeText(text);
        setCopiedColor(colorHex);
        setNotification(`تم نسخ ${text}`);
        setTimeout(() => {
            setCopiedColor(null);
            setNotification(null);
        }, 2000);
    };

    return (
        <div className="min-h-screen transition-colors" dir="rtl">

            {/* Hero Section */}
            <section className="bg-card py-8 border-b border-border shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">عناصر الهوية البصرية السورية</h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            المواد المرتبطة بالهوية البصرية السورية - مجموعة غير رسمية ومجمّعة من أماكن متعددة بانتظار الإصدار الرسمي للهوية
                        </p>
                        <a
                            href="https://syrianidentity.sy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-gradient-to-r from-[#6b1f2a] to-[#4a151e] text-white hover:from-[#4a151e] hover:to-[#3a1118] h-12 px-6 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <ExternalLink className="ml-2 h-4 w-4" />
                            زيارة الموقع الرسمي للهوية البصرية السورية
                        </a>
                    </div>
                </div>
            </section>

            {/* Main Container */}
            <div className="container mx-auto my-8 max-w-6xl">
                <Card className="overflow-hidden border-2 border-border shadow-2xl">

                    {/* Color Palette Section */}
                    <div className="p-10" id="colors">
                        <h2 className="text-4xl font-bold text-center text-foreground mb-8 pb-4 border-b-4 border-[#428177]">لوحة الألوان</h2>
                        <p className="text-center text-lg mb-8 text-muted-foreground">يمكنك النقر على اللون لنسخ الرمز مباشرةً</p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {COLOR_PALETTES.map((palette) => (
                                <div key={palette.name} className="mb-5">
                                    <div className="text-2xl font-semibold mb-2 text-center text-foreground">{palette.name}</div>
                                    <div className="flex overflow-hidden shadow-lg border-4 border-border">
                                        {palette.colors.map((color) => (
                                            <div
                                                key={color.hex}
                                                className="flex-1 p-5 min-h-[140px] flex items-end cursor-pointer transition-all duration-200 ease-in-out hover:scale-105"
                                                style={{
                                                    backgroundColor: color.hex,
                                                    color: color.textColor
                                                }}
                                                onClick={() => copyToClipboard(color.hex, color.hex)}
                                            >
                                                <div className="color-text">
                                                    <div className="font-mono text-sm font-bold mb-1">{color.hex}</div>
                                                    <div className="text-xs opacity-80 whitespace-pre-line">{color.cmyk.replace(/ /g, '\n')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Typography / Font Section */}
                    <div className="p-10 border-t border-border" id="typography">
                        <h2 className="text-4xl font-bold text-center text-foreground mb-8 pb-4 border-b-4 border-[#428177]">الخطوط</h2>
                        <p className="text-center text-lg mb-8 text-muted-foreground">احصل على خط قمرة المستخدم في الهوية البصرية السورية</p>

                        <div className="text-center mb-8">
                            <img
                                src="/syid/materials/qomra2.webp"
                                alt="خط قمرة"
                                className="mx-auto max-w-full h-auto shadow-lg border-4 border-border"
                                style={{ maxHeight: '300px' }}
                            />
                        </div>

                        <div className="text-center">
                            <a
                                href="https://iwantype.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-gradient-to-r from-[#428177] to-[#054239] text-white font-semibold text-lg py-4 px-10 no-underline transition-transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                شراء الخطوط من iWantype
                            </a>
                            <p className="mt-4 text-muted-foreground">
                                استخدم كود الخصم <span className="font-semibold text-foreground">syrianzone</span> للخصم 25% على خط قمرة المستخدم في الهوية البصرية السورية
                            </p>
                        </div>
                    </div>

                    {/* Flag Proportions Section */}
                    <div className="p-10 border-t border-border" id="flag">
                        <h2 className="text-4xl font-bold text-center text-foreground mb-8 pb-4 border-b-4 border-[#428177]">العلم السوري ونسبه</h2>
                        <p className="text-center text-lg mb-8 text-muted-foreground">النسب الدقيقة لتصميم العلم السوري الرسمي، كما هو موضح في المخطط أدناه.</p>

                        <div className="flag-diagram-wrapper">
                            <div className="flag-diagram-container">
                                {/* Flag Visual */}
                                <div className="flag-visual">
                                    <div className="stripe green"></div>
                                    <div className="stripe white">
                                        <svg className="star" viewBox="0 0 100 95"><path d="M50,0 L61.2,36.2 L100,36.2 L69.1,58.8 L79.4,95 L50,72.5 L20.6,95 L30.9,58.8 L0,36.2 L38.8,36.2 Z" fill="#ce1126" /></svg>
                                        <svg className="star" viewBox="0 0 100 95"><path d="M50,0 L61.2,36.2 L100,36.2 L69.1,58.8 L79.4,95 L50,72.5 L20.6,95 L30.9,58.8 L0,36.2 L38.8,36.2 Z" fill="#ce1126" /></svg>
                                        <svg className="star" viewBox="0 0 100 95"><path d="M50,0 L61.2,36.2 L100,36.2 L69.1,58.8 L79.4,95 L50,72.5 L20.6,95 L30.9,58.8 L0,36.2 L38.8,36.2 Z" fill="#ce1126" /></svg>
                                    </div>
                                    <div className="stripe black"></div>
                                </div>

                                {/* Top Measurements */}
                                <div className="dim-line h-line top-line-h"></div>
                                <div className="measurement top-total-num">36</div>
                                <div className="dim-line v-line top-line-v-1"></div>
                                <div className="dim-line v-line top-line-v-2"></div>
                                <div className="dim-line v-line top-line-v-3"></div>
                                <div className="dim-line v-line top-line-v-4"></div>
                                <div className="dim-line v-line top-line-v-5"></div>
                                <div className="measurement top-num-1">9</div>
                                <div className="measurement top-num-2">9</div>
                                <div className="measurement top-num-3">9</div>
                                <div className="measurement top-num-4">9</div>

                                {/* Right Measurements */}
                                <div className="dim-line v-line right-line-v"></div>
                                <div className="measurement right-total-num">24</div>
                                <div className="dim-line h-line right-line-h-1"></div>
                                <div className="dim-line h-line right-line-h-2"></div>
                                <div className="dim-line h-line right-line-h-3"></div>
                                <div className="dim-line h-line right-line-h-4"></div>
                                <div className="measurement right-num-1">8</div>
                                <div className="measurement right-num-2">8</div>
                                <div className="measurement right-num-3">8</div>

                                {/* Bottom Measurements */}
                                <div className="dim-line h-line bottom-line-h"></div>
                                <div className="dim-line v-line bottom-line-v-1"></div>
                                <div className="dim-line v-line bottom-line-v-2"></div>
                                <div className="dim-line v-line bottom-line-v-3"></div>
                                <div className="dim-line v-line bottom-line-v-4"></div>
                                <div className="dim-line v-line bottom-line-v-5"></div>
                                <div className="dim-line v-line bottom-line-v-6"></div>
                                <div className="measurement bottom-num-1">6</div>
                                <div className="measurement bottom-num-2">6</div>
                                <div className="measurement bottom-num-3">3</div>
                                <div className="measurement bottom-num-4">6</div>
                                <div className="measurement bottom-num-5">3</div>
                                <div className="measurement bottom-num-6">6</div>
                                <div className="measurement bottom-num-7">6</div>

                                {/* Left Measurements */}
                                <div className="dim-line v-line left-line-v"></div>
                                <div className="measurement left-num-1">6</div>
                                <div className="dim-line h-line left-line-h-1"></div>
                                <div className="dim-line h-line left-line-h-2"></div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                            <a
                                href="/syid/materials/العلم السوري بالنسب الصحيحة.png"
                                download
                                className="inline-block bg-gradient-to-r from-[#6b1f2a] to-[#4a151e] text-white font-semibold text-lg py-4 px-10 no-underline transition-transform hover:-translate-y-0.5 hover:shadow-lg text-center"
                            >
                                تحميل PNG
                            </a>
                            <a
                                href="/syid/materials/العلم السوري بالنسب الصحيحة.svg"
                                download
                                className="inline-block bg-gradient-to-r from-[#6b1f2a] to-[#4a151e] text-white font-semibold text-lg py-4 px-10 no-underline transition-transform hover:-translate-y-0.5 hover:shadow-lg text-center"
                            >
                                تحميل SVG
                            </a>
                            <a
                                href="/syid/materials/علم سوريا.dwg"
                                download
                                className="inline-block bg-gradient-to-r from-[#6b1f2a] to-[#4a151e] text-white font-semibold text-lg py-4 px-10 no-underline transition-transform hover:-translate-y-0.5 hover:shadow-lg text-center"
                            >
                                تحميل DWG
                            </a>
                        </div>
                    </div>

                    {/* Materials Section */}
                    <div className="p-10 border-t border-border" id="materials">
                        <h2 className="text-4xl font-bold text-center text-foreground mb-8 pb-4 border-b-4 border-[#428177]">المواد والموارد</h2>
                        <p className="text-center text-lg mb-8 text-muted-foreground">تحميل المواد الرسمية والموارد المرئية للهوية البصرية السورية الجديدة.</p>

                        <div className="text-center mb-8">
                            <img
                                src="/syid/materials/logo.ai.svg"
                                alt="شعار الهوية البصرية السورية"
                                className="mx-auto max-w-full h-auto shadow-lg border-4 border-border"
                                style={{ maxHeight: '200px' }}
                            />
                        </div>

                        <div className="text-center">
                            <a
                                href="https://syrianidentity.sy/media-and-press"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center bg-gradient-to-r from-[#428177] to-[#054239] text-white font-semibold text-lg py-4 px-10 no-underline transition-transform hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <Download className="ml-2 h-5 w-5" />
                                تحميل المواد والموارد الرسمية
                            </a>
                        </div>
                    </div>

                    {/* Wallpapers Grid */}
                    {wallpapers.length > 0 && (
                        <div className="p-10 border-t border-border" id="wallpapers">
                            <h2 className="text-4xl font-bold text-center text-foreground mb-8 pb-4 border-b-4 border-[#428177]">خلفيات ومواد تصميمية</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wallpapers.map((wallpaper, index) => (
                                    <Card key={index} className="overflow-hidden group border-2 border-border">
                                        <div className="aspect-video relative overflow-hidden bg-muted">
                                            <img
                                                src={wallpaper.imageSrc}
                                                alt={wallpaper.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-bold text-foreground mb-2">{wallpaper.title}</h3>

                                            {wallpaper.designerName && (
                                                <div className="mb-3">
                                                    <a
                                                        href={wallpaper.designerLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1"
                                                    >
                                                        <Badge variant="secondary" className="text-xs">
                                                            {wallpaper.designerName}
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                        </Badge>
                                                    </a>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {wallpaper.downloadJpg && (
                                                    <a href={wallpaper.downloadJpg} download>
                                                        <Button size="sm" variant="outline" className="bg-muted text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                                                            <Download className="h-3 w-3 ml-1" />
                                                            JPG
                                                        </Button>
                                                    </a>
                                                )}
                                                {wallpaper.downloadPng && (
                                                    <a href={wallpaper.downloadPng} download>
                                                        <Button size="sm" variant="outline" className="bg-muted text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                                                            <Download className="h-3 w-3 ml-1" />
                                                            PNG
                                                        </Button>
                                                    </a>
                                                )}
                                                {wallpaper.downloadSvg && (
                                                    <a href={wallpaper.downloadSvg} download>
                                                        <Button size="sm" variant="outline" className="bg-muted text-foreground border-border hover:bg-accent hover:text-accent-foreground">
                                                            <Download className="h-3 w-3 ml-1" />
                                                            SVG
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                </Card>
            </div>

            {/* Notification */}
            {notification && (
                <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-[#428177] text-white px-6 py-4 shadow-lg z-50">
                    {notification}
                </div>
            )}

            {/* Footer */}
            <footer className="bg-card border-t border-border py-6 mt-12 transition-colors">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-foreground">&copy; 2025 syrian.zone</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        تم التطوير بواسطة <span className="font-semibold">هادي الأحمد</span>
                    </p>
                    <div className="mt-2 flex justify-center gap-4">
                        <a href="http://hadealahmad.com/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#428177] transition-colors flex items-center">
                            الموقع الشخصي
                        </a>
                        <a href="https://x.com/hadealahmad" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#428177] transition-colors flex items-center">
                            حساب X
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
