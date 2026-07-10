import Button from "../../../components/common/Button.jsx";
import Input from "../../../components/common/Input.jsx";
import AvatarPicker from "../../../components/common/AvatarPicker.jsx";

export default function ProfileEditForm({
    usernameId,
    usernameDraft,
    onUsernameChange,
    usernameStatus,
    draftAvatar,
    onAvatarSelect,
    avatarOptions,
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
                    options={avatarOptions}
                />
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
