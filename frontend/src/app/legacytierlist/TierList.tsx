"use client";

import React, { useState, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { TierItem, TIERS } from './data';
import html2canvas from 'html2canvas';

// --- Types ---
interface TierListProps {
    initialItems: TierItem[];
    title: string;
    subtitle?: string;
    descriptionMobile?: string;
    descriptionDesktop?: string;
}

// --- Draggable Item Component ---
function DraggableItem({ item, isSelected, onClick }: { item: TierItem; isSelected?: boolean; onClick?: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { item },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                // Determine if it was a drag or a click
                // @dnd-kit handles this, but for our click-to-select logic on mobile:
                if (onClick) onClick();
            }}
            className={`
                w-24 h-40 bg-card border rounded p-1 m-1 flex flex-col items-center justify-start cursor-grab touch-manipulation select-none
                ${isDragging ? 'opacity-50 border-dashed border-muted-foreground' : 'border-border shadow-sm'}
                ${isSelected ? 'ring-2 ring-primary transform scale-105 z-10' : ''}
            `}
            style={{ touchAction: 'none' }} // Important for dnd-kit on mobile
        >
            <img
                src={item.image}
                alt={item.label}
                className="w-full h-24 object-contain mb-1 pointer-events-none"
            />
            <p className="text-[10px] text-center leading-tight line-clamp-3 overflow-hidden text-foreground font-medium">
                {item.label}
            </p>
        </div>
    );
}

// --- Droppable Zone Component ---
function DroppableZone({ id, children, className, onClick }: { id: string; children: React.ReactNode; className?: string; onClick?: () => void }) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                ${className}
                ${isOver ? 'bg-accent/50 ring-2 ring-primary/20' : ''}
                transition-colors duration-200
            `}
        >
            {children}
        </div>
    );
}

export default function TierList({ initialItems, title, subtitle, descriptionMobile, descriptionDesktop }: TierListProps) {
    // State: items mapped to container IDs ('bank' or tier IDs)
    const [itemState, setItemState] = useState<{ [itemId: string]: string }>(() => {
        const initialState: { [key: string]: string } = {};
        initialItems.forEach(item => {
            initialState[item.id] = 'bank';
        });
        return initialState;
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null); // For click-to-move
    const containerRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 }
        })
    );

    // --- Actions ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setSelectedId(null); // Clear selection on drag
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id) {
            setItemState(prev => ({
                ...prev,
                [active.id]: over.id as string
            }));
        }
    };

    const handleItemClick = (itemId: string) => {
        if (selectedId === itemId) {
            setSelectedId(null);
        } else {
            setSelectedId(itemId);
        }
    };

    const handleZoneClick = (zoneId: string) => {
        if (selectedId) {
            setItemState(prev => ({
                ...prev,
                [selectedId]: zoneId
            }));
            setSelectedId(null);
        }
    };

    const handleSaveImage = () => {
        if (!containerRef.current) return;

        // Clone for capture to ensure fixed width and styling
        const element = containerRef.current;
        const button = element.querySelector('#save-btn');
        if (button) (button as HTMLElement).style.display = 'none'; // Hide button

        // We can capture the 'tiers-container' specifically if we want just the list, 
        // but user might want the bank too? The original captured just the tiers usually.
        // Let's capture the whole containerRef but minus the bank if desired?
        // The original script captured 'tiers-container'.

        const tiersNode = element.querySelector('#tiers-container') as HTMLElement;

        if (tiersNode) {
            html2canvas(tiersNode, {
                backgroundColor: 'transparent',
                scale: 2
            } as any).then(canvas => {
                const link = document.createElement('a');
                link.download = 'tier-list.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error('Screen capture failed:', err);
            }).then(() => {
                if (button) (button as HTMLElement).style.display = '';
            });
        }
    };

    const getItemsInZone = (zoneId: string) => {
        return initialItems.filter(item => itemState[item.id] === zoneId);
    };

    const activeItem = activeId ? initialItems.find(i => i.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div ref={containerRef} className="max-w-5xl mx-auto bg-background p-6 rounded-lg shadow-sm border border-border">
                <h1 className="text-3xl font-bold text-center text-foreground mb-6">{title}</h1>
                {subtitle && <p className="text-center text-muted-foreground mb-4">{subtitle}</p>}

                <div className="text-sm text-center text-muted-foreground mb-6 space-y-1">
                    <p className="hidden md:block">{descriptionDesktop || 'اسحب وأفلت الأسماء لترتيبها في القائمة.'}</p>
                    <p className="md:hidden">{descriptionMobile || 'اضغط على الاسم ثم اضغط على المكان الذي تريد نقله إليه.'}</p>
                </div>

                {/* Item Bank */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-foreground mb-2 border-b border-border pb-2">قائمة الأسماء</h2>
                    <DroppableZone
                        id="bank"
                        className="min-h-[140px] bg-muted border-2 border-dashed border-border rounded-lg p-2 flex flex-wrap gap-2"
                        onClick={() => handleZoneClick('bank')}
                    >
                        {getItemsInZone('bank').map(item => (
                            <DraggableItem
                                key={item.id}
                                item={item}
                                isSelected={selectedId === item.id}
                                onClick={() => handleItemClick(item.id)}
                            />
                        ))}
                    </DroppableZone>
                </div>

                {/* Tiers Container (Target for screenshot) */}
                <div id="tiers-container" className="space-y-1 bg-background p-2 rounded">
                    {TIERS.map(tier => (
                        <div key={tier.id} className="flex min-h-[100px]">
                            {/* Tier Label */}
                            <div
                                className="w-20 md:w-24 flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white rounded-r-md"
                                style={{ backgroundColor: tier.color }}
                            >
                                {tier.label}
                            </div>

                            {/* Tier Dropzone */}
                            <DroppableZone
                                id={tier.id}
                                className="flex-grow bg-muted/30 border-y border-l border-r border-border rounded-l-md p-2 flex flex-wrap content-start"
                                onClick={() => handleZoneClick(tier.id)}
                            >
                                {getItemsInZone(tier.id).map(item => (
                                    <DraggableItem
                                        key={item.id}
                                        item={item}
                                        isSelected={selectedId === item.id}
                                        onClick={() => handleItemClick(item.id)}
                                    />
                                ))}
                            </DroppableZone>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        id="save-btn"
                        onClick={handleSaveImage}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        حفظ القائمة كصورة
                    </button>
                </div>
            </div>

            <DragOverlay>
                {activeItem ? (
                    <div className="w-24 h-40 bg-card border border-border rounded p-1 shadow-2xl opacity-90 flex flex-col items-center justify-start scale-105 cursor-grabbing">
                        <img src={activeItem.image} alt={activeItem.label} className="w-full h-24 object-contain mb-1" />
                        <p className="text-[10px] text-center leading-tight line-clamp-3 overflow-hidden text-foreground">{activeItem.label}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
