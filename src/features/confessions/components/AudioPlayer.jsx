import { Pause, Play, RotateCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getConfessionAudioUrl } from "../../../services/confession.service.js";

const AUDIO_PLAY_EVENT = "fullyme:audio-play";

function formatDuration(seconds) {
    const safe = Math.max(0, Math.round(Number(seconds) || 0));
    const minutes = Math.floor(safe / 60);
    const remaining = safe % 60;
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export default function AudioPlayer({ roomId, confessionId, audio }) {
    const audioRef = useRef(null);
    const playerId = useMemo(() => `confession-audio-${roomId}-${confessionId}`, [confessionId, roomId]);
    const [src, setSrc] = useState("");
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [resolvedDuration, setResolvedDuration] = useState(() => Number(audio && audio.duration) || 0);
    const [error, setError] = useState("");

    const playbackRate = useMemo(() => {
        const pitchShift = Number(audio && audio.pitchShift) || 0;
        return Math.pow(2, pitchShift / 1200);
    }, [audio]);

    const applyPitchShift = () => {
        const node = audioRef.current;
        if (node) {
            node.preservesPitch = false;
            node.playbackRate = playbackRate;
        }
    };

    useEffect(() => {
        applyPitchShift();
    }, [src, playbackRate]);

    useEffect(() => {
        const handleOtherAudioPlay = (event) => {
            if (!event || !event.detail || event.detail.playerId === playerId) return;
            const node = audioRef.current;
            if (node && !node.paused) {
                node.pause();
            }
            setPlaying(false);
        };
        window.addEventListener(AUDIO_PLAY_EVENT, handleOtherAudioPlay);
        return () => window.removeEventListener(AUDIO_PLAY_EVENT, handleOtherAudioPlay);
    }, [playerId]);

    if (!audio) return null;

    const handleToggle = async (event) => {
        event.stopPropagation();
        if (!audio.available) {
            setError("Audio expired");
            return;
        }

        try {
            setError("");
            setLoading(true);
            let nextSrc = src;
            if (!nextSrc) {
                const result = await getConfessionAudioUrl(roomId, confessionId);
                nextSrc = result && result.url ? result.url : "";
                setSrc(nextSrc);
            }
            if (!nextSrc) throw new Error("Audio unavailable");

            const node = audioRef.current;
            if (!node) return;
            if (playing) {
                node.pause();
                setPlaying(false);
            } else {
                if (node.src !== nextSrc) {
                    node.src = nextSrc;
                    node.load();
                }
                applyPitchShift();
                window.dispatchEvent(new CustomEvent(AUDIO_PLAY_EVENT, { detail: { playerId } }));
                await node.play();
                applyPitchShift();
                setPlaying(true);
            }
        } catch (err) {
            if (err && err.status === 410) {
                setError("Audio expired");
            } else if (err && err.status) {
                setError("Audio unavailable");
            } else {
                setError("Tap again");
            }
            setPlaying(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="audio-player" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="audio-player__button" onClick={handleToggle} disabled={loading}>
                {loading ? <RotateCw className="audio-player__spin" size={15} /> : playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
            </button>
            <span className="audio-player__duration">
                {formatDuration(currentTime)} / {formatDuration(resolvedDuration || audio.duration)}
            </span>
            {error && <span className="audio-player__error">{error}</span>}
            <audio
                ref={audioRef}
                preload="none"
                controls={false}
                controlsList="nodownload"
                onLoadedMetadata={(event) => {
                    const duration = Number(event.currentTarget.duration || 0);
                    if (Number.isFinite(duration) && duration > 0) setResolvedDuration(duration);
                    applyPitchShift();
                }}
                onPlay={applyPitchShift}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
                onEnded={() => {
                    setPlaying(false);
                    setCurrentTime(0);
                }}
                onPause={() => setPlaying(false)}
            />
        </div>
    );
}
