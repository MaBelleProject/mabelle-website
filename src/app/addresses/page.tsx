"use client";

import { useRequireCustomer } from "@/context/customer-context";
import { storefrontApi, type SavedAddress, type StorefrontDeliveryCity } from "@/lib/api";
import { ArrowLeft, Check, Edit2, MapPin, Plus, Star, Trash2, Truck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import CitySelect from "@/components/city-select";

type FormData = {
  name: string;
  phone: string;
  address: string;
  city: string;
  floor: string;
  notes: string;
  isDefault: boolean;
};

const emptyForm = (): FormData => ({ name: "", phone: "", address: "", city: "", floor: "", notes: "", isDefault: false });

export default function AddressesPage() {
  const { customer } = useRequireCustomer();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [deliveryCities, setDeliveryCities] = useState<StorefrontDeliveryCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settingDefault, setSettingDefault] = useState<number | null>(null);

  useEffect(() => {
    if (!customer) return;
    Promise.all([
      storefrontApi.getAddresses(customer.id),
      storefrontApi.deliveryCities(),
    ])
      .then(([addrs, cities]) => { setAddresses(addrs); setDeliveryCities(cities); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!customer) return null;

  const selectedCityRecord = deliveryCities.find(c => c.name === form.city);
  const selectedDeliveryFee = selectedCityRecord?.deliveryFee ? parseFloat(selectedCityRecord.deliveryFee) : null;

  const openAdd = () => {
    setForm({ ...emptyForm(), isDefault: addresses.length === 0 });
    setErrors({});
    setEditing("new");
  };

  const openEdit = (addr: SavedAddress) => {
    setForm({
      name: addr.name ?? "",
      phone: addr.phone ?? "",
      address: addr.address,
      city: addr.city,
      floor: addr.floor ?? "",
      notes: addr.notes ?? "",
      isDefault: addr.isDefault,
    });
    setErrors({});
    setEditing(addr);
  };

  const closeForm = () => { setEditing(null); setErrors({}); };

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (typeof value === "string" && errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.city) e.city = "City is required";
    if (!form.address.trim()) e.address = "Delivery address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const sortAddresses = (list: SavedAddress[]) =>
    [...list].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || b.id - a.id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim(),
        city: form.city,
        floor: form.floor.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isDefault: form.isDefault,
      };
      if (editing === "new") {
        const created = await storefrontApi.createAddress(customer.id, payload);
        setAddresses(prev => {
          const list = payload.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev;
          return sortAddresses([created, ...list]);
        });
      } else {
        const updated = await storefrontApi.updateAddress(customer.id, (editing as SavedAddress).id, payload);
        setAddresses(prev => {
          const list = payload.isDefault
            ? prev.map(a => a.id === updated.id ? updated : { ...a, isDefault: false })
            : prev.map(a => a.id === updated.id ? updated : a);
          return sortAddresses(list);
        });
      }
      closeForm();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Failed to save address" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await storefrontApi.deleteAddress(customer.id, id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
    } catch {
      setDeleting(false);
    }
    setDeleting(false);
  };

  const handleSetDefault = async (id: number) => {
    setSettingDefault(id);
    try {
      await storefrontApi.setDefaultAddress(customer.id, id);
      setAddresses(prev => sortAddresses(prev.map(a => ({ ...a, isDefault: a.id === id }))));
    } catch {}
    setSettingDefault(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-stone-400 hover:text-[var(--brand)] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-stone-800">My Addresses</h1>
        </div>
        {editing === null && !loading && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white text-sm font-semibold rounded-full hover:bg-[var(--brand-dark)] transition"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Empty state */}
          {addresses.length === 0 && editing === null && (
            <div className="text-center py-16">
              <MapPin className="w-14 h-14 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-500 mb-5">No saved addresses yet.</p>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--brand)] text-white font-semibold rounded-full hover:bg-[var(--brand-dark)] transition text-sm"
              >
                <Plus className="w-4 h-4" /> Add Your First Address
              </button>
            </div>
          )}

          {/* Address cards */}
          <div className="flex flex-col gap-4">
            {addresses.map(addr => {
              const cityRecord = deliveryCities.find(c => c.name.toLowerCase() === addr.city.toLowerCase());
              return (
                <div
                  key={addr.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${addr.isDefault ? "border-[var(--brand)]" : "border-[var(--sage-light)]"}`}
                >
                  <div className="px-5 py-4">
                    {addr.isDefault && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] mb-2">
                        <Star className="w-3.5 h-3.5" fill="currentColor" /> Default Address
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800">{addr.name ?? customer.name}</p>
                        <p className="text-sm text-stone-500">{addr.phone ?? customer.phone}</p>
                      </div>
                      {cityRecord?.deliveryFee && (
                        <span className="shrink-0 flex items-center gap-1 text-xs text-stone-500 bg-[var(--sage-light)] rounded-full px-2.5 py-1">
                          <Truck className="w-3 h-3" />${parseFloat(cityRecord.deliveryFee).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-700 mt-2">
                      {addr.city}{addr.address ? `, ${addr.address}` : ""}
                      {addr.floor ? <span className="text-stone-400"> · {addr.floor}</span> : null}
                    </p>
                    {addr.notes && (
                      <p className="text-xs text-stone-400 mt-1 italic">{addr.notes}</p>
                    )}
                  </div>
                  <div className="border-t border-[var(--sage-light)] px-5 py-2.5 flex items-center gap-4 bg-stone-50">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        disabled={settingDefault === addr.id}
                        className="flex items-center gap-1 text-xs text-stone-500 hover:text-[var(--brand)] transition disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" />
                        {settingDefault === addr.id ? "Setting…" : "Set as Default"}
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(addr)}
                      className="flex items-center gap-1 text-xs text-stone-500 hover:text-[var(--brand)] transition ml-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(addr.id)}
                      className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add / Edit form */}
          {editing !== null && (
            <div className="bg-white rounded-2xl border border-[var(--brand)] shadow-sm mt-4 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sage-light)]">
                <h2 className="font-semibold text-stone-800">
                  {editing === "new" ? "New Address" : "Edit Address"}
                </h2>
                <button onClick={closeForm} className="text-stone-400 hover:text-stone-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
                {errors.form && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errors.form}</p>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.name}>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set("name", e.target.value)}
                      placeholder={customer.name}
                      className={inputCls(!!errors.name)}
                    />
                  </Field>
                  <Field label="Phone" error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      placeholder={customer.phone}
                      className={inputCls(!!errors.phone)}
                    />
                  </Field>
                </div>

                <Field label="City *" error={errors.city}>
                  <CitySelect
                    cities={deliveryCities}
                    value={form.city}
                    onChange={v => set("city", v)}
                    hasError={!!errors.city}
                  />
                  {selectedDeliveryFee !== null && (
                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Delivery fee: ${selectedDeliveryFee.toFixed(2)}
                    </p>
                  )}
                </Field>

                <Field label="Street Address *" error={errors.address}>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    placeholder="Street, building, landmark…"
                    className={inputCls(!!errors.address)}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Floor / Apt" error={errors.floor}>
                    <input
                      type="text"
                      value={form.floor}
                      onChange={e => set("floor", e.target.value)}
                      placeholder="e.g. 3rd floor, apt 12"
                      className={inputCls(!!errors.floor)}
                    />
                  </Field>
                  <Field label="Delivery Instructions" error={errors.notes}>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={e => set("notes", e.target.value)}
                      placeholder="e.g. Ring doorbell twice"
                      className={inputCls(!!errors.notes)}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    role="checkbox"
                    aria-checked={form.isDefault}
                    onClick={() => set("isDefault", !form.isDefault)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${
                      form.isDefault ? "bg-[var(--brand)] border-[var(--brand)]" : "border-stone-300"
                    }`}
                  >
                    {form.isDefault && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-stone-700">Set as default address</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--brand)] text-white text-sm font-semibold rounded-full hover:bg-[var(--brand-dark)] disabled:opacity-60 transition"
                  >
                    {saving ? "Saving…" : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-2.5 text-stone-500 text-sm rounded-full hover:bg-[var(--sage-light)] transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-stone-800 text-lg mb-2">Delete Address?</h3>
            <p className="text-stone-500 text-sm mb-5">
              This address will be permanently removed from your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full text-sm transition disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 text-stone-600 font-medium rounded-full text-sm hover:bg-[var(--sage-light)] transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
      : "border-stone-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]"
  }`;
}


function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
