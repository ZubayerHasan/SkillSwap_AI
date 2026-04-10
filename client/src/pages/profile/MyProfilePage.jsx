import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateProfile, uploadAvatar } from "../../api/profileApi";
import { useDispatch } from "react-redux";
import { updateUser } from "../../store/slices/authSlice";
import { setProfile } from "../../store/slices/profileSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import ProgressBar from "../../components/common/ProgressBar";
import toast from "react-hot-toast";

const MyProfilePage = () => {
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => getMyProfile().then(r => r.data.data.user),
  });

  const updateMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profile", "me"] });
      const profileCompleteness = res.data.data.profileCompleteness ?? res.data.data.user?.profileCompleteness ?? 0;
      dispatch(updateUser({ ...res.data.data.user, profileCompleteness }));
      dispatch(setProfile({ user: { ...res.data.data.user, profileCompleteness }, profileCompleteness }));
      setEditing(false);
      toast.success("Profile updated!");
    },
    onError: e => toast.error(e.response?.data?.message || "Update failed"),
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res = await uploadAvatar(fd);
      const profileCompleteness = res.data.data.profileCompleteness ?? data?.profileCompleteness ?? 0;
      dispatch(updateUser({ avatar: res.data.data.avatar, profileCompleteness }));
      dispatch(setProfile({ user: { ...data, avatar: res.data.data.avatar, profileCompleteness }, profileCompleteness }));
      qc.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Avatar updated!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const startEdit = () => {
    setForm({
      name: data?.name || "",
      bio: data?.bio || "",
      university: data?.university || "",
      department: data?.department || "",
      contactPreference: data?.contactPreference || "in_app",
    });
    setEditing(true);
  };

  if (isLoading) return <PageWrapper><div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="card h-24 animate-shimmer" />)}</div></PageWrapper>;

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-display font-bold text-text-primary">My Profile</h1>

        {/* Avatar + completeness */}
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar src={data?.avatar?.url} name={data?.name} size="xl" />
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-white text-xs">Change</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
              </label>
              {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold text-text-primary">{data?.name}</h2>
              <p className="text-text-muted text-sm">{data?.university}</p>
              <div className="mt-3">
                <ProgressBar value={data?.profileCompleteness || 0} label="Profile Completeness" />
                {(data?.profileCompleteness || 0) < 60 && (
                  <p className="text-xs text-warning mt-1">Complete your profile to appear in match results</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={startEdit}>Edit</Button>
          </div>
        </Card>

        {/* Profile info */}
        {!editing ? (
          <Card className="p-6 space-y-4">
            {[
              { label: "Bio", value: data?.bio || "No bio yet" },
              { label: "Department", value: data?.department || "Not set" },
              { label: "Contact Preference", value: data?.contactPreference },
              { label: "Trust Score", value: `${data?.trustScore}/100` },
              { label: "Member since", value: data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-text-muted text-sm">{label}</span>
                <span className="text-text-primary text-sm text-right">{value}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">Edit Profile</h3>
            <form onSubmit={e => { e.preventDefault(); updateMut.mutate(form); }} className="space-y-4">
              <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Bio</label>
                <textarea rows={3} className="input resize-none" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} maxLength={500} />
              </div>
              <Input label="University" value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} />
              <Input label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Contact Preference</label>
                <select className="input" value={form.contactPreference} onChange={e => setForm(f => ({ ...f, contactPreference: e.target.value }))}>
                  <option value="in_app">In-App Only</option>
                  <option value="email">Email Only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)} type="button">Cancel</Button>
                <Button className="flex-1" loading={updateMut.isPending} type="submit">Save Changes</Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

export default MyProfilePage;
