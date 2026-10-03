import { Phone, Plus, Star, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { EmptyState, ErrorState, InlineError, LoadingState } from "@/components/ui/States";
import { useToast } from "@/contexts/ToastContext";
import { useAsync } from "@/hooks/useAsync";
import { getErrorMessage } from "@/lib/api";
import { userService } from "@/services/userService";
import { validateName, validatePhone } from "@/utils/validation";

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function EmergencyContactsManager({ callable = false }: { callable?: boolean }) {
  const toast = useToast();
  const contacts = useAsync(() => userService.listContacts(), []);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [errors, setErrors] = useState<{ name?: string | null; phone?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const next = { name: validateName(name), phone: validatePhone(phone) };
    setErrors(next);
    if (next.name || next.phone) return;
    setSaving(true);
    setFormError(null);
    try {
      await userService.createContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim() || null,
        is_primary: false,
      });
      setName("");
      setPhone("");
      setRelationship("");
      setAdding(false);
      toast.success("Contact saved");
      await contacts.reload();
    } catch (error) {
      setFormError(getErrorMessage(error, "Couldn't save the contact."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Remove this contact?")) return;
    try {
      await userService.deleteContact(id);
      await contacts.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function makePrimary(id: number) {
    const contact = contacts.data?.find((c) => c.id === id);
    if (!contact) return;
    try {
      await userService.updateContact(id, { ...contact, is_primary: true });
      await contacts.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (contacts.loading && !contacts.data) return <LoadingState label="Loading contacts…" />;
  if (contacts.error && !contacts.data) return <ErrorState message={contacts.error} onRetry={contacts.reload} />;

  return (
    <div className="space-y-3">
      {contacts.data?.length ? (
        <ul className="space-y-2">
          {contacts.data.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium text-white">
                  {c.name}
                  {c.is_primary && (
                    <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-[10px] font-semibold text-primary-200">Primary</span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {c.phone}
                  {c.relationship ? ` · ${c.relationship}` : ""}
                </p>
              </div>
              {callable && (
                <a
                  href={telHref(c.phone)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-sm font-semibold text-white"
                >
                  <Phone className="size-4" aria-hidden /> Call
                </a>
              )}
              {!c.is_primary && (
                <button onClick={() => void makePrimary(c.id)} aria-label={`Make ${c.name} primary`} title="Make primary" className="rounded-full p-2 text-slate-400 hover:text-amber-300">
                  <Star className="size-4" />
                </button>
              )}
              <button onClick={() => void remove(c.id)} aria-label={`Remove ${c.name}`} className="rounded-full p-2 text-slate-400 hover:text-rose-300">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !adding && (
          <EmptyState compact icon={Phone} title="No trusted contacts yet" message="Add someone you'd like to reach quickly when things feel hard." />
        )
      )}

      {adding ? (
        <form onSubmit={handleAdd} noValidate className="space-y-3 rounded-2xl border border-white/8 p-3">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={100} />
          <TextField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} placeholder="+91 98765 43210" />
          <TextField label="Relationship (optional)" value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={50} placeholder="Mother, friend…" />
          <InlineError message={formError} />
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>
              Save contact
            </Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        (contacts.data?.length ?? 0) < 5 && (
          <Button variant="outline" size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add contact
          </Button>
        )
      )}
    </div>
  );
}
