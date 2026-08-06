import Button from "../../../components/common/Button.jsx";
import Input from "../../../components/common/Input.jsx";
import AvatarPicker from "../../../components/common/AvatarPicker.jsx";
import { AVATAR_OPTIONS } from "../../../constants/avatars.js";

export default function ProfileEditForm({
    usernameId,
    usernameDraft,
    onUsernameChange,
    usernameStatus,
    draftAvatar,
    onAvatarSelect,
    saving,
    onCancel,
    onSubmit
}) {
    return (
        <form className="figma-edit-modal__body-form" onSubmit={onSubmit}>
            <Input
                label="Username"
                id={usernameId}
                value={usernameDraft}
                onChange={onUsernameChange}
                placeholder="Choose a username"
                autoComplete="username"
                maxLength={20}
                error={usernameStatus.status === 'error' ? usernameStatus.message : null}
                success={usernameStatus.status === 'success' ? usernameStatus.message : null}
                helperText={usernameStatus.status === 'checking' ? usernameStatus.message : null}
            />

            <div style={{ marginTop: '1.4rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#243355', display: 'block', marginBottom: '0.5rem' }}>
                    Avatar
                </span>
                <AvatarPicker
                    selectedAvatar={draftAvatar}
                    onSelect={onAvatarSelect}
                />
                {draftAvatar && (() => {
                    const sel = AVATAR_OPTIONS.find(a => a.id === draftAvatar);
                    if (sel) {
                        return (
                            <div className="figma-edit-modal__avatar-desc" style={{ marginTop: '1rem' }}>
                                <h5 style={{ margin: 0, fontSize: '0.9rem', color: '#243355' }}>{sel.name}</h5>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#6B7280' }}>"{sel.quote}"</p>
                            </div>
                        );
                    }
                    return null;
                })()}
            </div>

            <div className="figma-edit-modal__actions" style={{ padding: '0', marginTop: '1.8rem' }}>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
