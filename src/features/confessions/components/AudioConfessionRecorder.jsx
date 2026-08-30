import { Check, Mic, RefreshCw, Square, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { InlineSpinner } from "../../../components/loaders";
import { useGlobalError } from "../../../context/ErrorContext.jsx";
import useAudioRecorder from "../hooks/useAudioRecorder.js";

const MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    return `0:${String(safe).padStart(2, "0")}`;
}

function uploadAudio({ token, blob, onProgress }) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", blob);
        form.append("api_key", token.apiKey);
        form.append("signature", token.signature);
        const signedParams = token.uploadParams || {
            timestamp: token.timestamp,
            folder: token.folder,
            allowed_formats: (token.allowedFormats || ["webm", "ogg", "mp3", "mp4"]).join(","),
            use_filename: "false",
            unique_filename: "true",
            overwrite: "false",
            context: token.context,
            tags: token.tags
        };
        Object.entries(signedParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                form.append(key, String(value));
            }
        });

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && typeof onProgress === "function") {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        xhr.onload = () => {
            let payload = null;
            try {
                payload = JSON.parse(xhr.responseText || "{}");
            } catch {
                payload = null;
            }
            if (xhr.status >= 200 && xhr.status < 300 && payload && payload.public_id) {
                resolve(payload);
            } else {
                reject(new Error((payload && payload.error && payload.error.message) || "Audio upload failed."));
            }
        };
        xhr.onerror = () => reject(new Error("Audio upload failed."));
        xhr.open("POST", token.uploadUrl);
        xhr.send(form);
    });
}

export default function AudioConfessionRecorder({
    token,
    tokenLoading,
    onFetchToken,
    onAudioReady,
    ready
}) {
    const recorder = useAudioRecorder({ maxDurationSeconds: token?.maxDurationSeconds || 30 });
    const { showError } = useGlobalError();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleStart = async () => {
        recorder.start();
    };

    const handleFileSelect = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (file.size > MAX_AUDIO_SIZE_BYTES) {
            const errorMsg = "Audio file size must be under 10MB";
            showError(errorMsg);
            recorder.setError(errorMsg);
            if (event.target) event.target.value = "";
            return;
        }

        recorder.setError("");
        recorder.setRecordedFile(file);
        if (event.target) event.target.value = "";
    };

    const handleUse = async () => {
        if (!recorder.blob) return;

        if (recorder.blob.size > MAX_AUDIO_SIZE_BYTES) {
            const errorMsg = "Audio file size must be under 10MB";
            showError(errorMsg);
            recorder.setError(errorMsg);
            return;
        }

        try {
            setUploading(true);
            setProgress(0);
            const uploadToken = token || await onFetchToken?.();
            if (!uploadToken) {
                throw new Error("Audio uploads are not available right now.");
            }
            const maxAllowedBytes = Math.max(MAX_AUDIO_SIZE_BYTES, Number(uploadToken.maxBytes) || MAX_AUDIO_SIZE_BYTES);
            if (recorder.blob.size > maxAllowedBytes) {
                throw new Error("Audio file size must be under 10MB");
            }
            const result = await uploadAudio({
                token: uploadToken,
                blob: recorder.blob,
                onProgress: setProgress
            });
            const measuredDuration = Math.max(
                1,
                Math.min(
                    Number(uploadToken.maxDurationSeconds || 30),
                    Math.round(Number(result.duration) || Number(recorder.duration) || 1)
                )
            );
            onAudioReady?.({
                audioPublicId: result.public_id,
                audioDuration: measuredDuration,
                bytes: Number(result.bytes || recorder.blob.size || 0)
            });
        } catch (err) {
            const errorText = (err && err.message) || "";
            if (errorText.includes("10MB") || errorText.includes("too large") || recorder.blob.size > MAX_AUDIO_SIZE_BYTES) {
                const errorMsg = "Audio file size must be under 10MB";
                showError(errorMsg);
                recorder.setError(errorMsg);
            } else if (err && err.status === 503) {
                recorder.setError("Audio uploads are not enabled on the server yet.");
            } else {
                recorder.setError(errorText || "Audio upload failed.");
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="audio-recorder">
            {recorder.state === "idle" && (
                <div className="audio-recorder__idle-actions" style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <button type="button" className="audio-recorder__start" onClick={handleStart} disabled={tokenLoading} style={{ flex: 1 }}>
                        {tokenLoading ? <InlineSpinner size="sm" /> : <Mic size={18} strokeWidth={2.2} />}
                        <span>{tokenLoading ? "Preparing..." : "Record audio"}</span>
                    </button>
                    <button
                        type="button"
                        className="audio-recorder__start"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={tokenLoading}
                        style={{ flex: 1 }}
                    >
                        <Upload size={18} strokeWidth={2.2} />
                        <span>Upload audio</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                    />
                </div>
            )}

            {recorder.state === "recording" && (
                <div className="audio-recorder__recording">
                    <div className="audio-recorder__pulse" aria-hidden="true" />
                    <strong>{formatDuration(recorder.duration)}</strong>
                    <button type="button" onClick={recorder.stop}>
                        <Square size={15} fill="currentColor" />
                        <span>Stop</span>
                    </button>
                </div>
            )}

            {recorder.state === "recorded" && (
                <div className="audio-recorder__preview">
                    <audio src={recorder.previewUrl} controls controlsList="nodownload" />
                    {uploading ? (
                        <div className="audio-recorder__progress-wrap">
                            <div className="audio-recorder__progress-bar">
                                <span style={{ width: `${progress}%` }} />
                            </div>
                            <small>Uploading {progress}%</small>
                        </div>
                    ) : ready ? (
                        <div className="audio-recorder__done">
                            <Check size={16} />
                            <span>Audio ready</span>
                        </div>
                    ) : (
                        <div className="audio-recorder__preview-actions">
                            <button type="button" onClick={recorder.reset}>
                                <RefreshCw size={15} />
                                <span>Redo</span>
                            </button>
                            <button type="button" onClick={handleUse}>
                                <Upload size={15} />
                                <span>Use this</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {recorder.error && <p className="audio-recorder__error">{recorder.error}</p>}
        </div>
    );
}
