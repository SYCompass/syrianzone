"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Save, X, MoreVertical, Star as StarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types
interface Candidate {
    id: string;
    candidate_group_id?: string | null;
    name: string;
    title?: string | null;
    image_url?: string | null;
    imageUrl?: string | null; // Frontend helper
    category?: string | null;
}

interface Group {
    id: string;
    poll_id: string;
    name: string;
    key?: string | null;
    sort_order: number;
    is_default?: boolean;
}

interface PollData {
    id: string;
    candidates: Candidate[];
    groups: Group[];
}

interface Props {
    pollId: string;
    initialData: PollData;
    onRefresh: () => void;
}

export default function AdminPollManager({ pollId, initialData, onRefresh }: Props) {
    const [groups, setGroups] = useState<Group[]>(initialData.groups || []);
    const [candidates, setCandidates] = useState<Candidate[]>(initialData.candidates || []);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [error, setError] = useState<string | null>(null);

    // Sync state when props change
    useEffect(() => {
        setGroups(initialData.groups || []);
        setCandidates(initialData.candidates || []);
    }, [initialData]);

    // Group Management
    const [newGroupName, setNewGroupName] = useState("");
    const [isAddingGroup, setIsAddingGroup] = useState(false);

    const handleAddGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsAddingGroup(true);
        try {
            await axios.post("/candidate-groups", { poll_id: pollId, name: newGroupName });
            setNewGroupName("");
            onRefresh();
        } catch (err) {
            console.error(err);
            setError("Failed to add group");
        } finally {
            setIsAddingGroup(false);
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm("Delete this group and unassign its candidates?")) return;
        try {
            await axios.delete(`/candidate-groups/${id}`);
            onRefresh();
            if (activeTab === id) setActiveTab("all");
        } catch (err) {
            console.error(err);
            setError("Failed to delete group");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await axios.post(`/candidate-groups/${id}/default`);
            onRefresh();
        } catch (err) {
            console.error(err);
            setError("فشل تعيين المجموعة الافتراضية");
        }
    };

    const handleMoveGroup = async (id: string, direction: 'left' | 'right') => {
        const index = groups.findIndex(g => g.id === id);
        if (index === -1) return;

        const newGroups = [...groups];
        // RTL logic: 
        // "Right" arrow (visual Right) -> index - 1
        // "Left" arrow (visual Left) -> index + 1

        const targetIndex = direction === 'left' ? index + 1 : index - 1;

        if (targetIndex < 0 || targetIndex >= newGroups.length) return;

        // Swap
        [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];

        // Optimistic update
        setGroups(newGroups);

        // Send new order
        const orderPayload = newGroups.map((g, idx) => ({
            id: g.id,
            sort_order: idx
        }));

        try {
            await axios.post('/candidate-groups/reorder', { groups: orderPayload });
            // onRefresh(); 
        } catch (err) {
            console.error(err);
            setError("فشل إعادة الترتيب");
            onRefresh(); // Revert
        }
    };

    // Candidate Management
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);

    // Form State
    const [cName, setCName] = useState("");
    const [cTitle, setCTitle] = useState("");
    const [cImage, setCImage] = useState("");
    // const [cCategory, setCCategory] = useState("minister"); // Removed static category
    const [cGroupId, setCGroupId] = useState<string | null>(null);

    const openAddCandidate = (groupId: string | null) => {
        setEditingCandidate(null);
        setCName("");
        setCTitle("");
        setCImage("");
        // setCCategory("minister");
        if (groupId) {
            setCGroupId(groupId);
        } else {
            setCGroupId(null);
        }
        setIsCandidateModalOpen(true);
    };

    const openEditCandidate = (c: Candidate) => {
        setEditingCandidate(c);
        setCName(c.name);
        setCTitle(c.title || "");
        setCImage(c.image_url || c.imageUrl || "");
        // setCCategory(c.category || "minister");
        setCGroupId(c.candidate_group_id || null);
        setIsCandidateModalOpen(true);
    };

    const handleSaveCandidate = async () => {
        if (!cName.trim()) return;

        const payload: any = {
            name: cName,
            title: cTitle || null,
            image_url: cImage || null,
            // category: cCategory || null,
            candidate_group_id: cGroupId || null,
        };

        // If adding new
        if (!editingCandidate) {
            payload.poll_id = pollId;
            // If active tab is a specific group, assign it
            if (activeTab !== "all") {
                payload.candidate_group_id = activeTab;
            }
        }

        try {
            if (editingCandidate) {
                await axios.put(`/candidates/${editingCandidate.id}`, payload);
            } else {
                await axios.post("/candidates", payload);
            }
            setIsCandidateModalOpen(false);
            onRefresh();
        } catch (err) {
            console.error(err);
            setError("Failed to save candidate");
        }
    };

    const handleDeleteCandidate = async (id: string) => {
        if (!confirm("Are you sure you want to delete this candidate?")) return;
        try {
            await axios.delete(`/candidates/${id}`);
            onRefresh();
        } catch (err) {
            console.error(err);
            setError("Failed to delete candidate");
        }
    };

    // Filter candidates for display
    const displayedCandidates = activeTab === "all"
        ? candidates
        : candidates.filter(c => c.candidate_group_id === activeTab);

    return (
        <div className="space-y-6">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                        <TabsTrigger
                            value="all"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border bg-background"
                        >
                            All Candidates ({candidates.length})
                        </TabsTrigger>
                        {groups.map(g => (
                            <TabsTrigger
                                key={g.id}
                                value={g.id}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border bg-background"
                            >
                                {g.name} ({candidates.filter(c => c.candidate_group_id === g.id).length})
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Input
                                placeholder="New Group Name"
                                className="w-40 h-8 text-sm"
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <Button size="sm" variant="outline" onClick={handleAddGroup} disabled={isAddingGroup}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="mb-4 flex justify-between items-center bg-muted/40 p-2 rounded-md">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                            {activeTab === "all" ? "جميع المرشحين" : groups.find(g => g.id === activeTab)?.name}
                        </h3>
                        {activeTab !== "all" && (
                            <div className="flex items-center gap-1 mr-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleSetDefault(activeTab)}
                                    title="تعيين كمجموعة افتراضية"
                                >
                                    <StarIcon
                                        className={`h-4 w-4 ${groups.find(g => g.id === activeTab)?.is_default ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                    />
                                </Button>
                                <div className="h-4 w-[1px] bg-border mx-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleMoveGroup(activeTab, 'left')}
                                    title="تحريك لليمين"
                                    disabled={groups.findIndex(g => g.id === activeTab) === groups.length - 1}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleMoveGroup(activeTab, 'right')}
                                    title="تحريك لليسار"
                                    disabled={groups.findIndex(g => g.id === activeTab) === 0}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div className="h-4 w-[1px] bg-border mx-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive h-8 w-8 p-0"
                                    onClick={() => handleDeleteGroup(activeTab)}
                                    title="حذف المجموعة"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <Button onClick={() => openAddCandidate(activeTab === "all" ? null : activeTab)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Candidate
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedCandidates.map(candidate => (
                        <Card key={candidate.id} className="overflow-hidden">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    {(candidate.image_url || candidate.imageUrl) ? (
                                        <img src={candidate.image_url || candidate.imageUrl || ""} alt={candidate.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-xs text-gray-500">Img</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate" title={candidate.name}>{candidate.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{candidate.title}</p>
                                    <div className="flex mt-1 gap-1">
                                        {/* Show group badge if "all" view */}
                                        {activeTab === "all" && candidate.candidate_group_id && (
                                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full">
                                                {groups.find(g => g.id === candidate.candidate_group_id)?.name || "Unknown Group"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditCandidate(candidate)}>
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDeleteCandidate(candidate.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {displayedCandidates.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            No candidates found in this group.
                        </div>
                    )}
                </div>
            </Tabs>

            {/* Edit/Add Modal */}
            <Dialog open={isCandidateModalOpen} onOpenChange={setIsCandidateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCandidate ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="c-name" className="text-right">Name</Label>
                            <Input id="c-name" value={cName} onChange={e => setCName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="c-title" className="text-right">Title</Label>
                            <Input id="c-title" value={cTitle} onChange={e => setCTitle(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="c-image" className="text-right">Image URL</Label>
                            <Input id="c-image" value={cImage} onChange={e => setCImage(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="c-group" className="text-right">Group</Label>
                            <Select value={cGroupId || "none"} onValueChange={(val) => setCGroupId(val === "none" ? null : val)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Group</SelectItem>
                                    {groups.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCandidateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveCandidate}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
