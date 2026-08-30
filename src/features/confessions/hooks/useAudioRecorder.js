import { useCallback, useEffect, useRef, useState } from "react";

const MIME_TYPES = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/webm"
];

function getSupportedMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export default function useAudioRecorder({ maxDurationSeconds = 30 } = {}) {
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const [state, setState] = useState("idle");
    const [duration, setDuration] = useState(0);
    const [blob, setBlob] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [error, setError] = useState("");

    const stopTracks = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
        }
        stopTracks();
        chunksRef.current = [];
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        setState("idle");
        setDuration(0);
        setBlob(null);
        setError("");
        setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return "";
        });
    }, [stopTracks]);

    const stop = useCallback(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
            recorderRef.current.stop();
        }
    }, []);

    const start = useCallback(async () => {
        setError("");
        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            setError("Audio recording is not supported on this browser.");
            return;
        }

        try {
            reset();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream, { mimeType });
            recorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
            };
            recorder.onstop = () => {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
                stopTracks();
                const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
                setBlob(recordedBlob);
                setPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return URL.createObjectURL(recordedBlob);
                });
                setState("recorded");
            };

            recorder.start();
            setState("recording");
            setDuration(0);
            timerRef.current = window.setInterval(() => {
                setDuration((current) => {
                    const next = current + 1;
                    if (next >= maxDurationSeconds) {
                        window.clearInterval(timerRef.current);
                        timerRef.current = null;
                        stop();
                    }
                    return Math.min(next, maxDurationSeconds);
                });
            }, 1000);
        } catch (err) {
            stopTracks();
            setState("idle");
            setError(err && err.name === "NotAllowedError"
                ? "Microphone permission is needed to record audio."
                : "Unable to start audio recording.");
        }
    }, [maxDurationSeconds, reset, stop, stopTracks]);

    const setRecordedFile = useCallback((fileBlob, durationSec = 1) => {
        reset();
        setBlob(fileBlob);
        setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return URL.createObjectURL(fileBlob);
        });
        setDuration(durationSec);
        setState("recorded");
    }, [reset]);

    useEffect(() => () => reset(), [reset]);

    return {
        state,
        duration,
        blob,
        previewUrl,
        error,
        isRecording: state === "recording",
        start,
        stop,
        reset,
        setError,
        setState,
        setRecordedFile
    };
}
