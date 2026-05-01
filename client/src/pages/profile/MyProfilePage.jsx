import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateProfile, uploadAvatar } from "../../api/profileApi";
import { getMyPortfolio, addPortfolioItem, deletePortfolioItem } from "../../api/profileApi";
import { useDropzone } from "react-dropzone";
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

const resolvePortfolioUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
  const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");
  const backendOrigin = normalizedApiBaseUrl
    ? normalizedApiBaseUrl.replace(/\/api$/, "")
    : (window.location.origin.includes(":5173") ? window.location.origin.replace(":5173", ":5000") : window.location.origin);

  return `${backendOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getPortfolioKind = (item) => {
  const mimeType = String(item?.mimeType || "").toLowerCase();
  const sourceFileName = String(item?.sourceFileName || "").toLowerCase();
  const url = String(item?.url || "").toLowerCase();

  if (item?.type === "pdf" || mimeType === "application/pdf" || sourceFileName.endsWith(".pdf") || url.endsWith(".pdf")) {
    return "pdf";
  }

  if (item?.type === "image" || mimeType.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(sourceFileName) || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url)) {
    return "image";
  }

  return "link";
};

const MyProfilePage = () => {
  const dispatch = useDispatch();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ title: "", caption: "", url: "" });
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioPreviewUrl, setPortfolioPreviewUrl] = useState("");

  const onPortfolioDrop = useCallback((acceptedFiles) => {
    setPortfolioFile(acceptedFiles?.[0] || null);
  }, []);

  const onPortfolioDropRejected = useCallback(() => {
    toast.error("Please upload an image or PDF up to 10MB");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onPortfolioDrop,
    onDropRejected: onPortfolioDropRejected,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: {
      "image/*": [],
      "application/pdf": [".pdf"],
      "application/x-pdf": [".pdf"],
    },
  });

  useEffect(() => {
    if (!portfolioFile) {
      setPortfolioPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(portfolioFile);
    setPortfolioPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [portfolioFile]);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => getMyProfile().then(r => r.data.data.user),
  });

  const { data: portfolioData } = useQuery({
    queryKey: ["profile", "portfolio", "me"],
    queryFn: () => getMyPortfolio().then((response) => response.data.data),
  });

  const portfolio = portfolioData?.portfolio || [];

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

  const addPortfolioMut = useMutation({
    mutationFn: async () => {
      const title = portfolioForm.title.trim();
      const caption = portfolioForm.caption.trim();
      const url = portfolioForm.url.trim();

      if (!title) throw new Error("Portfolio title is required");
      if (!portfolioFile && !url) throw new Error("Upload a file or paste a link");

      const fd = new FormData();
      fd.append("title", title);
      fd.append("caption", caption);
      if (url) fd.append("url", url);
      if (portfolioFile) fd.append("portfolio", portfolioFile, portfolioFile.name);

      return addPortfolioItem(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", "portfolio", "me"] });
      setPortfolioForm({ title: "", caption: "", url: "" });
      setPortfolioFile(null);
      toast.success("Portfolio item added");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || "Failed to add portfolio item");
    },
  });

  const deletePortfolioMut = useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", "portfolio", "me"] });
      toast.success("Portfolio item removed");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete portfolio item");
    },
  });

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
          <div className="space-y-6">
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

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-text-primary">Portfolio</h3>
                  <p className="text-sm text-text-muted">Upload examples, case studies, or external links.</p>
                </div>
                <span className="text-xs text-text-muted">{portfolio.length} items</span>
              </div>

              <div
                {...getRootProps()}
                className={`rounded-2xl border border-dashed p-5 transition-colors cursor-pointer ${isDragActive
                  ? "border-brand bg-brand-dim/10"
                  : "border-border bg-background-elevated/70 hover:border-brand/40"
                }`}
              >
                <input {...getInputProps()} />
                <p className="font-medium text-text-primary">
                  {isDragActive ? "Drop the file here" : "Drag an image or PDF here, or click to browse"}
                </p>
                <p className="text-xs text-text-muted mt-1">Images and PDFs up to 10MB</p>
              </div>

              {portfolioFile && portfolioPreviewUrl && (
                <div className="rounded-2xl border border-border bg-background-primary overflow-hidden">
                  {portfolioFile.type?.startsWith("image/") ? (
                    <img
                      src={portfolioPreviewUrl}
                      alt={portfolioFile.name}
                      className="w-full max-h-64 object-cover"
                    />
                  ) : portfolioFile.type === "application/pdf" ? (
                    <iframe
                      title={portfolioFile.name}
                      src={portfolioPreviewUrl}
                      className="w-full h-64"
                    />
                  ) : (
                    <div className="p-4 text-sm text-text-muted">Preview unavailable for this file type.</div>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Portfolio title"
                  value={portfolioForm.title}
                  onChange={(event) => setPortfolioForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Project showcase"
                />
                <Input
                  label="External link (optional)"
                  value={portfolioForm.url}
                  onChange={(event) => setPortfolioForm((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-1 block">Caption</label>
                <textarea
                  rows={3}
                  className="input resize-none"
                  value={portfolioForm.caption}
                  onChange={(event) => setPortfolioForm((current) => ({ ...current, caption: event.target.value }))}
                  placeholder="What does this item show?"
                  maxLength={300}
                />
              </div>

              {portfolioFile && (
                <div className="rounded-xl border border-border bg-background-primary p-3 text-sm text-text-secondary flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary truncate">{portfolioFile.name}</p>
                    <p className="text-xs text-text-muted">{portfolioFile.type || "File selected"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPortfolioFile(null)}
                    className="text-xs text-danger hover:text-danger/80"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <Button loading={addPortfolioMut.isPending} onClick={() => addPortfolioMut.mutate()}>
                  Add portfolio item
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {portfolio.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-border bg-background-elevated p-6 text-sm text-text-muted text-center">
                    Your portfolio is empty for now.
                  </div>
                ) : (
                  portfolio.map((item) => (
                    <div key={item._id} className="rounded-2xl border border-border bg-background-elevated overflow-hidden flex flex-col">
                      {item.url ? (
                        <a
                          href={resolvePortfolioUrl(item.url)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="aspect-[4/3] bg-background-primary flex items-center justify-center overflow-hidden cursor-pointer"
                          aria-label={`Open ${item.title}`}
                        >
                          {getPortfolioKind(item) === "image" ? (
                            <img src={resolvePortfolioUrl(item.url)} alt={item.title} className="w-full h-full object-cover" />
                          ) : getPortfolioKind(item) === "pdf" ? (
                            <div className="text-center p-4">
                              <div className="text-4xl">📄</div>
                              <p className="text-sm text-text-primary mt-2">PDF</p>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <div className="text-4xl">🔗</div>
                              <p className="text-sm text-text-primary mt-2">External link</p>
                            </div>
                          )}
                        </a>
                      ) : (
                        <div className="aspect-[4/3] bg-background-primary flex items-center justify-center overflow-hidden">
                          {getPortfolioKind(item) === "image" ? (
                            <div className="text-center p-4">
                              <div className="text-4xl">🖼️</div>
                              <p className="text-sm text-text-primary mt-2">Image</p>
                            </div>
                          ) : getPortfolioKind(item) === "pdf" ? (
                            <div className="text-center p-4">
                              <div className="text-4xl">📄</div>
                              <p className="text-sm text-text-primary mt-2">PDF</p>
                            </div>
                          ) : (
                            <div className="text-center p-4">
                              <div className="text-4xl">🔗</div>
                              <p className="text-sm text-text-primary mt-2">External link</p>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4 space-y-3 flex-1 flex flex-col">
                        <div>
                          <h4 className="font-semibold text-text-primary line-clamp-1">{item.title}</h4>
                          {item.url && (
                            <a
                              href={resolvePortfolioUrl(item.url)}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-sm text-brand hover:text-brand-hover underline underline-offset-2 truncate text-left cursor-pointer pointer-events-auto"
                            >
                              {item.sourceFileName || item.url}
                            </a>
                          )}
                          {item.caption && <p className="text-sm text-text-secondary mt-1 line-clamp-3">{item.caption}</p>}
                        </div>
                        <div className="mt-auto flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Delete this portfolio item?")) {
                                deletePortfolioMut.mutate(item._id);
                              }
                            }}
                            className="text-xs text-danger hover:text-danger/80"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
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
