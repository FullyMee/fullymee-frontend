import {
    ArrowLeft,
    CheckCircle2,
    ChevronUp,
    Copy,
    Heart,
    Lightbulb,
    Lock,
    LogOut,
    MessageSquare,
    Plus,
    Share2,
    Shield,
    Sparkles,
    Send
} from "lucide-react";

export function ArrowLeftIcon() {
    return <ArrowLeft size={18} strokeWidth={2} />;
}

export function ShareIcon() {
    return <Share2 size={18} strokeWidth={2} />;
}

export function UpvoteIcon({ active = false }) {
    return <Heart size={18} fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 2} />;
}

export function HeartIcon({ filled = false }) {
    return <Heart size={18} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 2} />;
}

export function SendIcon({ filled = false }) {
    return <Send size={18} fill={filled ? "currentColor" : "none"} strokeWidth={filled ? 0 : 2} />;
}

export function CheckCircleIcon() {
    return <CheckCircle2 size={18} strokeWidth={2} />;
}

export function CommentIcon() {
    return <MessageSquare size={18} strokeWidth={2} />;
}

export function SparkRoomIcon() {
    return <Sparkles size={18} strokeWidth={2} />;
}

export function BulbIcon() {
    return <Lightbulb size={18} strokeWidth={2} />;
}

export function LockIcon() {
    return <Lock size={18} strokeWidth={2} />;
}

export function CopyIcon() {
    return <Copy size={18} strokeWidth={2} />;
}

export function PlusIcon() {
    return <Plus size={18} strokeWidth={2} />;
}

export function LeaveIcon() {
    return <LogOut size={18} strokeWidth={2} />;
}

export function ShieldIcon() {
    return <Shield size={18} strokeWidth={2} />;
}
