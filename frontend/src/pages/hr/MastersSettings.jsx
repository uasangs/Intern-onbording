// import { PageHeader, SectionCard } from '../../components/ui'
// import { Plus, Trash2, Save, AlertCircle, CheckCircle, Edit2, X } from 'lucide-react'
// import toast from 'react-hot-toast'
// import { fetchMasters, saveMastersToDb, invalidateMastersCache, DEFAULT_MASTERS } from '../../utils/masters'
// import { useState, useEffect } from 'react'

// function MasterList({ items, onAdd, onDelete, addPlaceholder, renderItem }) {
//   const [newItem, setNewItem] = useState('')
//   const [error, setError] = useState('')

//   const handleAdd = () => {
//     const val = newItem.trim()
//     if (!val) { setError('Please enter a value'); return }
//     if (items.includes(val)) { setError('Already exists'); return }
//     setError('')
//     onAdd(val)
//     setNewItem('')
//   }

//   return (
//     <div className="space-y-2">
//       {items.length === 0 && (
//         <p className="text-xs text-slate-400 italic py-2">No items yet. Add one below.</p>
//       )}
//       {items.map((item, i) => (
//         <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 group">
//           <span className="text-sm text-slate-700">{renderItem ? renderItem(item) : item}</span>
//           <button onClick={() => onDelete(i)}
//             className="text-slate-200 group-hover:text-red-400 hover:text-red-500 transition-colors p-1 rounded"
//             title="Delete">
//             <Trash2 className="w-3.5 h-3.5" />
//           </button>
//         </div>
//       ))}
//       <div className="flex gap-2 pt-1">
//         <div className="flex-1">
//           <input className="input text-sm w-full"
//             placeholder={addPlaceholder || 'Add new...'}
//             value={newItem}
//             onChange={e => { setNewItem(e.target.value); setError('') }}
//             onKeyDown={e => e.key === 'Enter' && handleAdd()}
//           />
//           {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
//         </div>
//         <button onClick={handleAdd}
//           className="btn-secondary flex items-center gap-1 text-xs px-3 flex-shrink-0">
//           <Plus className="w-3.5 h-3.5" />Add
//         </button>
//       </div>
//     </div>
//   )
// }

// export default function MastersSettings() {
//   const [masters, setMasters] = useState(DEFAULT_MASTERS)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchMasters().then(data => {
//       setMasters(data)
//       setLoading(false)
//     })
//   }, [])
//   const [isDirty, setIsDirty] = useState(false)
//   const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved

//   // New item states
//   const [newStipend, setNewStipend] = useState({ label: '', amount: '' })
//   const [stipendError, setStipendError] = useState('')
//   const [newDoc, setNewDoc] = useState({ label: '', required: false })
//   const [docError, setDocError] = useState('')
//   const [newFmt, setNewFmt] = useState({ department: '', header: '', signatory: '', footer: '' })
//   const [fmtError, setFmtError] = useState('')
//   const [editFmt, setEditFmt] = useState(null) // index being edited

//   const update = (key, val) => {
//     setMasters(p => ({ ...p, [key]: val }))
//     setIsDirty(true)
//   }

//   const addToList = (key, val) => update(key, [...(masters[key] || []), val])
//   const deleteFromList = (key, i) => {
//     if (!window.confirm('Delete this item?')) return
//     update(key, masters[key].filter((_, idx) => idx !== i))
//   }

//   const handleSave = async () => {
//     setSaveStatus('saving')
//     try {
//       await saveMastersToDb(masters)
//       invalidateMastersCache()
//       setSaveStatus('saved')
//       setIsDirty(false)
//       toast.success('Masters saved to database! Changes apply across all users and devices.')
//       setTimeout(() => setSaveStatus('idle'), 3000)
//     } catch (err) {
//       toast.error('Failed to save to database')
//       setSaveStatus('idle')
//     }
//   }

//   const handleReset = async () => {
//     if (!window.confirm('Reset all masters to default values? This cannot be undone.')) return
//     setMasters(DEFAULT_MASTERS)
//     await saveMastersToDb(DEFAULT_MASTERS)
//     invalidateMastersCache()
//     setIsDirty(false)
//     toast.success('Masters reset to defaults and saved to database')
//   }

//   const addStipend = () => {
//     if (!newStipend.label.trim()) { setStipendError('Label required'); return }
//     if (!newStipend.amount || isNaN(newStipend.amount) || parseInt(newStipend.amount) <= 0) {
//       setStipendError('Valid amount required'); return
//     }
//     if (masters.stipend_templates.some(t => t.label === newStipend.label.trim())) {
//       setStipendError('Label already exists'); return
//     }
//     setStipendError('')
//     update('stipend_templates', [...masters.stipend_templates, {
//       label: newStipend.label.trim(),
//       amount: parseInt(newStipend.amount)
//     }])
//     setNewStipend({ label: '', amount: '' })
//   }

//   const deleteStipend = (i) => {
//     if (!window.confirm('Delete this stipend template?')) return
//     update('stipend_templates', masters.stipend_templates.filter((_, idx) => idx !== i))
//   }

//   const addDoc = () => {
//     if (!newDoc.label.trim()) { setDocError('Document label required'); return }
//     const key = newDoc.label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
//     if (masters.document_checklist.some(d => d.key === key)) {
//       setDocError('Document with this name already exists'); return
//     }
//     setDocError('')
//     update('document_checklist', [...masters.document_checklist, {
//       key, label: newDoc.label.trim(), required: newDoc.required
//     }])
//     setNewDoc({ label: '', required: false })
//   }

//   const deleteDoc = (i) => {
//     const doc = masters.document_checklist[i]
//     if (!window.confirm(`Delete "${doc.label}" from checklist? Candidates won't be asked to upload this anymore.`)) return
//     update('document_checklist', masters.document_checklist.filter((_, idx) => idx !== i))
//   }

//   const toggleDocRequired = (i) => {
//     const updated = [...masters.document_checklist]
//     updated[i] = { ...updated[i], required: !updated[i].required }
//     update('document_checklist', updated)
//   }

//   const addLetterFormat = () => {
//     if (!newFmt.department.trim()) { setFmtError('Department required'); return }
//     if (!newFmt.header.trim()) { setFmtError('Header text required'); return }
//     if (masters.letter_formats?.some(f => f.department === newFmt.department.trim())) {
//       setFmtError('Format for this department already exists. Delete existing one first.'); return
//     }
//     setFmtError('')
//     update('letter_formats', [...(masters.letter_formats || []), {
//       department: newFmt.department.trim(),
//       header: newFmt.header.trim(),
//       signatory: newFmt.signatory.trim(),
//       footer: newFmt.footer.trim(),
//     }])
//     setNewFmt({ department: '', header: '', signatory: '', footer: '' })
//   }

//   const deleteLetterFormat = (i) => {
//     if (!window.confirm('Delete this letter format?')) return
//     update('letter_formats', masters.letter_formats.filter((_, idx) => idx !== i))
//   }

//   if (loading) return <div className="flex justify-center py-20"><div className="text-slate-400">Loading masters from database...</div></div>

//   return (
//     <div className="max-w-4xl space-y-6">
//       <PageHeader
//         title="Masters & Settings"
//         subtitle="Configure dropdowns, document checklist, stipend templates and letter formats used across the system"
//         action={
//           <div className="flex items-center gap-2">
//             {isDirty && (
//               <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
//                 <AlertCircle className="w-3 h-3" />Unsaved changes
//               </span>
//             )}
//             <button onClick={handleReset} className="btn-secondary text-xs px-3">Reset to Defaults</button>
//             <button onClick={handleSave}
//               className={`btn-primary flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-600' : ''}`}>
//               {saveStatus === 'saved'
//                 ? <><CheckCircle className="w-4 h-4" />Saved!</>
//                 : <><Save className="w-4 h-4" />Save All Changes</>
//               }
//             </button>
//           </div>
//         }
//       />

//       {/* Unsaved warning banner */}
//       {isDirty && (
//         <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-700">
//           <AlertCircle className="w-4 h-4 flex-shrink-0" />
//           You have unsaved changes. Click <strong className="mx-1">Save All Changes</strong> to apply across the system.
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

//         {/* Departments */}
//         <SectionCard title="Departments">
//           <p className="text-xs text-slate-400 mb-3">Used in: Initiate Intern form department dropdown</p>
//           <MasterList
//             items={masters.departments}
//             onAdd={v => addToList('departments', v)}
//             onDelete={i => deleteFromList('departments', i)}
//             addPlaceholder="e.g. Quality Control"
//           />
//         </SectionCard>

//         {/* Locations */}
//         <SectionCard title="Locations">
//           <p className="text-xs text-slate-400 mb-3">Used in: Initiate Intern form location dropdown</p>
//           <MasterList
//             items={masters.locations}
//             onAdd={v => addToList('locations', v)}
//             onDelete={i => deleteFromList('locations', i)}
//             addPlaceholder="e.g. Nagda"
//           />
//         </SectionCard>

//         {/* Asset Types */}
//         <SectionCard title="Asset Types (IT)">
//           <p className="text-xs text-slate-400 mb-3">Used in: IT provisioning task — other assets field</p>
//           <MasterList
//             items={masters.asset_types}
//             onAdd={v => addToList('asset_types', v)}
//             onDelete={i => deleteFromList('asset_types', i)}
//             addPlaceholder="e.g. USB Hub"
//           />
//         </SectionCard>

//         {/* Stipend Templates */}
//         <SectionCard title="Stipend Templates">
//           <p className="text-xs text-slate-400 mb-3">Used in: Initiate Intern form — quick-select stipend amounts</p>
//           <div className="space-y-2">
//             {masters.stipend_templates.map((t, i) => (
//               <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 group">
//                 <span className="text-sm text-slate-700">{t.label}</span>
//                 <div className="flex items-center gap-3">
//                   <span className="text-sm font-bold text-indigo-700">₹{t.amount.toLocaleString('en-IN')}/mo</span>
//                   <button onClick={() => deleteStipend(i)}
//                     className="text-slate-200 group-hover:text-red-400 hover:text-red-500 transition-colors p-1">
//                     <Trash2 className="w-3.5 h-3.5" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="flex gap-2 pt-3">
//             <input className="input flex-1 text-sm" placeholder="Label e.g. IIT Intern"
//               value={newStipend.label} onChange={e => { setNewStipend(p => ({ ...p, label: e.target.value })); setStipendError('') }} />
//             <input className="input w-28 text-sm" type="number" placeholder="₹ Amount"
//               value={newStipend.amount} onChange={e => { setNewStipend(p => ({ ...p, amount: e.target.value })); setStipendError('') }}
//               onKeyDown={e => e.key === 'Enter' && addStipend()} />
//             <button onClick={addStipend} className="btn-secondary text-xs px-3 flex items-center gap-1">
//               <Plus className="w-3.5 h-3.5" />Add
//             </button>
//           </div>
//           {stipendError && <p className="text-xs text-red-500 mt-1">{stipendError}</p>}
//         </SectionCard>
//       </div>

//       {/* Document Checklist */}
//       <SectionCard title="Document Checklist">
//         <p className="text-xs text-slate-400 mb-4">
//           Used in: Candidate portal Step 2 (upload documents). Required documents must be uploaded before proceeding. Toggle Required/Optional per document.
//         </p>
//         <div className="space-y-2 mb-4">
//           {masters.document_checklist.map((doc, i) => (
//             <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
//               <div className="flex items-center gap-3">
//                 <button onClick={() => toggleDocRequired(i)}
//                   className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors
//                     ${doc.required ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
//                   title="Click to toggle Required/Optional">
//                   {doc.required ? 'Required' : 'Optional'}
//                 </button>
//                 <span className="text-sm text-slate-700">{doc.label}</span>
//                 <span className="text-xs text-slate-300 font-mono">({doc.key})</span>
//               </div>
//               <button onClick={() => deleteDoc(i)}
//                 className="text-slate-200 group-hover:text-red-400 hover:text-red-500 transition-colors p-1">
//                 <Trash2 className="w-3.5 h-3.5" />
//               </button>
//             </div>
//           ))}
//         </div>
//         <div className="flex gap-2 items-center">
//           <div className="flex-1">
//             <input className="input text-sm w-full" placeholder="Document name e.g. NOC from College"
//               value={newDoc.label}
//               onChange={e => { setNewDoc(p => ({ ...p, label: e.target.value })); setDocError('') }}
//               onKeyDown={e => e.key === 'Enter' && addDoc()} />
//             {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
//           </div>
//           <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap cursor-pointer px-2">
//             <input type="checkbox" className="w-4 h-4" checked={newDoc.required}
//               onChange={e => setNewDoc(p => ({ ...p, required: e.target.checked }))} />
//             Required
//           </label>
//           <button onClick={addDoc} className="btn-secondary text-xs px-3 flex items-center gap-1 flex-shrink-0">
//             <Plus className="w-3.5 h-3.5" />Add
//           </button>
//         </div>
//       </SectionCard>

//       {/* Letter Formats */}
//       <SectionCard title="Department / Unit Letter Formats">
//         <p className="text-xs text-slate-400 mb-4">
//           Used in: Offer Letter and Experience Certificate PDF generation. Each department can have its own header, signatory, and footer.
//         </p>
//         <div className="space-y-3 mb-4">
//           {(masters.letter_formats || []).map((fmt, i) => (
//             <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
//               <div className="flex items-start justify-between gap-3">
//                 <div className="space-y-1.5 flex-1">
//                   <p className="text-sm font-bold text-slate-800">{fmt.department}</p>
//                   <p className="text-xs text-slate-500"><span className="text-slate-400">Header:</span> {fmt.header}</p>
//                   <p className="text-xs text-slate-500"><span className="text-slate-400">Signatory:</span> {fmt.signatory}</p>
//                   <p className="text-xs text-slate-500"><span className="text-slate-400">Footer:</span> {fmt.footer}</p>
//                 </div>
//                 <button onClick={() => deleteLetterFormat(i)}
//                   className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0">
//                   <Trash2 className="w-3.5 h-3.5" />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="grid grid-cols-2 gap-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
//           <p className="col-span-2 text-xs font-semibold text-indigo-700 mb-1">Add New Department Format</p>
//           <input className="input text-sm col-span-2" placeholder="Department name e.g. TRADC *"
//             value={newFmt.department} onChange={e => { setNewFmt(p => ({ ...p, department: e.target.value })); setFmtError('') }} />
//           <input className="input text-sm col-span-2" placeholder="Header text e.g. Grasim Industries Ltd. — TRADC Division *"
//             value={newFmt.header} onChange={e => { setNewFmt(p => ({ ...p, header: e.target.value })); setFmtError('') }} />
//           <input className="input text-sm" placeholder="Signatory e.g. Head - Human Resources"
//             value={newFmt.signatory} onChange={e => setNewFmt(p => ({ ...p, signatory: e.target.value }))} />
//           <input className="input text-sm" placeholder="Footer / address"
//             value={newFmt.footer} onChange={e => setNewFmt(p => ({ ...p, footer: e.target.value }))} />
//           {fmtError && <p className="text-xs text-red-500 col-span-2">{fmtError}</p>}
//           <button onClick={addLetterFormat}
//             className="col-span-2 btn-secondary text-xs flex items-center justify-center gap-1 py-2">
//             <Plus className="w-3.5 h-3.5" />Add Letter Format
//           </button>
//         </div>
//       </SectionCard>

//       {/* Save footer */}
//       <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
//         <p className="text-xs text-slate-500">
//           Changes are applied across: Initiate Intern form, Candidate portal document upload, Offer letter PDF generation.
//         </p>
//         <button onClick={handleSave}
//           className={`btn-primary flex items-center gap-2 px-8 ${saveStatus === 'saved' ? 'bg-green-600' : ''}`}>
//           {saveStatus === 'saved'
//             ? <><CheckCircle className="w-4 h-4" />Saved!</>
//             : <><Save className="w-4 h-4" />Save All Changes</>
//           }
//         </button>
//       </div>
//     </div>
//   )
// }

import { useState, useEffect, useCallback } from 'react'
import { PageHeader, SectionCard, Spinner } from '../../components/ui'
import { Plus, Trash2, Save, CheckCircle, AlertCircle, Edit2, X, Users, FileText, MapPin, Building2, CreditCard, Award, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { hrApi } from '../../api'
import { invalidateMastersCache } from '../../utils/masters'

// ── Reusable simple list editor ───────────────────────────────────────────────
function SimpleListSection({ title, hint, items, patchKey, patchFn, placeholder }) {
  const [list, setList] = useState(items)
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setList(items) }, [items])

  const save = async (newList) => {
    setSaving(true)
    try {
      await patchFn({ [patchKey]: newList })
      invalidateMastersCache()
      toast.success('Saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const add = () => {
    const val = newItem.trim()
    if (!val) { setError('Enter a value'); return }
    if (list.includes(val)) { setError('Already exists'); return }
    setError('')
    const updated = [...list, val]
    setList(updated)
    setNewItem('')
    save(updated)
  }

  const remove = (i) => {
    if (!window.confirm(`Remove "${list[i]}"?`)) return
    const updated = list.filter((_, idx) => idx !== i)
    setList(updated)
    save(updated)
  }

  return (
    <div className="space-y-3">
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {list.length === 0 && <p className="text-xs text-slate-400 italic">No items yet.</p>}
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
            <span className="text-sm text-slate-700">{item}</span>
            <button onClick={() => remove(i)} title="Remove"
              className="text-slate-200 group-hover:text-red-400 hover:text-red-500 p-1 rounded transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder={placeholder || 'Add new...'}
          value={newItem}
          onChange={e => { setNewItem(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && add()} />
        <button onClick={add} disabled={saving}
          className="btn-primary flex items-center gap-1 text-xs px-4">
          {saving ? <Spinner size="sm" /> : <Plus className="w-3.5 h-3.5" />}Add
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Departments ───────────────────────────────────────────────────────────────
function DepartmentsSection({ initial }) {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Departments</h2>
        <p className="text-xs text-slate-500 mt-0.5">Used in Initiate Intern form — department dropdown. Changes apply immediately.</p>
      </div>
      <SectionCard>
        <SimpleListSection
          items={initial}
          patchKey="departments"
          patchFn={hrApi.patchDepartments}
          placeholder="e.g. Quality Control"
          hint="Each department appears as an option when HR initiates a new intern."
        />
      </SectionCard>
    </div>
  )
}

// ── Locations ─────────────────────────────────────────────────────────────────
function LocationsSection({ initial }) {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Locations</h2>
        <p className="text-xs text-slate-500 mt-0.5">Used in Initiate Intern form — location dropdown and in offer letter generation.</p>
      </div>
      <SectionCard>
        <SimpleListSection
          items={initial}
          patchKey="locations"
          patchFn={hrApi.patchLocations}
          placeholder="e.g. Nagda"
          hint="Each location appears in the intern initiation form and is used in offer letter / certificate."
        />
      </SectionCard>
    </div>
  )
}

// ── Asset Types ───────────────────────────────────────────────────────────────
function AssetTypesSection({ initial }) {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Asset Types (IT)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Used by the IT team when provisioning assets for interns.</p>
      </div>
      <SectionCard>
        <SimpleListSection
          items={initial}
          patchKey="asset_types"
          patchFn={hrApi.patchAssetTypes}
          placeholder="e.g. USB Hub"
          hint="Asset types shown to IT team during provisioning."
        />
      </SectionCard>
    </div>
  )
}

// ── Stipend Templates ─────────────────────────────────────────────────────────
function StipendSection({ initial }) {
  const [templates, setTemplates] = useState(initial)
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setTemplates(initial) }, [initial])

  const save = async (list) => {
    setSaving(true)
    try {
      await hrApi.patchStipendTemplates({ stipend_templates: list })
      invalidateMastersCache()
      toast.success('Stipend templates saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const add = () => {
    if (!newLabel.trim()) { setError('Label required'); return }
    const amt = parseInt(newAmount)
    if (!amt || amt <= 0) { setError('Valid amount required'); return }
    if (templates.some(t => t.label === newLabel.trim())) { setError('Label already exists'); return }
    setError('')
    const updated = [...templates, { label: newLabel.trim(), amount: amt }]
    setTemplates(updated)
    setNewLabel(''); setNewAmount('')
    save(updated)
  }

  const remove = (i) => {
    if (!window.confirm(`Remove "${templates[i].label}"?`)) return
    const updated = templates.filter((_, idx) => idx !== i)
    setTemplates(updated)
    save(updated)
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Stipend Templates</h2>
        <p className="text-xs text-slate-500 mt-0.5">Quick-select amounts shown when HR initiates an intern. Also controls offer letter stipend line.</p>
      </div>
      <SectionCard>
        <p className="text-xs text-slate-400 mb-3">If stipend amount is 0 or not set, the stipend line is omitted from the offer letter entirely.</p>
        {templates.length === 0 && <p className="text-xs text-slate-400 italic mb-3">No templates yet.</p>}
        <div className="space-y-2 mb-4">
          {templates.map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
              <span className="text-sm text-slate-700">{t.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-indigo-700">₹{t.amount.toLocaleString('en-IN')}/mo</span>
                <button onClick={() => remove(i)}
                  className="text-slate-200 group-hover:text-red-400 hover:text-red-500 p-1 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" placeholder="Label e.g. IIT Intern"
            value={newLabel} onChange={e => { setNewLabel(e.target.value); setError('') }} />
          <input className="input w-32 text-sm" type="number" placeholder="₹ Amount"
            value={newAmount} onChange={e => { setNewAmount(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && add()} />
          <button onClick={add} disabled={saving}
            className="btn-primary flex items-center gap-1 text-xs px-4">
            {saving ? <Spinner size="sm" /> : <Plus className="w-3.5 h-3.5" />}Add
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </SectionCard>
    </div>
  )
}

// ── Document Checklist ────────────────────────────────────────────────────────
function DocumentsSection({ initial }) {
  const [docs, setDocs] = useState(initial)
  const [newLabel, setNewLabel] = useState('')
  const [newRequired, setNewRequired] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDocs(initial) }, [initial])

  const save = async (list) => {
    setSaving(true)
    try {
      await hrApi.patchDocumentChecklist({ document_checklist: list })
      invalidateMastersCache()
      toast.success('Document checklist saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const add = () => {
    if (!newLabel.trim()) { setError('Document name required'); return }
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (docs.some(d => d.key === key)) { setError('Document with this name already exists'); return }
    setError('')
    const updated = [...docs, { key, label: newLabel.trim(), required: newRequired }]
    setDocs(updated)
    setNewLabel('')
    save(updated)
  }

  const remove = (i) => {
    if (!window.confirm(`Remove "${docs[i].label}" from checklist? Candidates won't be asked to upload this.`)) return
    const updated = docs.filter((_, idx) => idx !== i)
    setDocs(updated)
    save(updated)
  }

  const toggle = (i) => {
    const updated = docs.map((d, idx) => idx === i ? { ...d, required: !d.required } : d)
    setDocs(updated)
    save(updated)
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Document Checklist</h2>
        <p className="text-xs text-slate-500 mt-0.5">Documents candidates must upload in Step 2 of the portal. Required docs block progression until uploaded.</p>
      </div>
      <SectionCard>
        {docs.length === 0 && <p className="text-xs text-slate-400 italic mb-3">No documents configured.</p>}
        <div className="space-y-2 mb-4">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(i)} title="Click to toggle Required/Optional"
                  className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors
                    ${doc.required ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                  {doc.required ? 'Required' : 'Optional'}
                </button>
                <span className="text-sm text-slate-700">{doc.label}</span>
                <span className="text-xs text-slate-300 font-mono">({doc.key})</span>
              </div>
              <button onClick={() => remove(i)}
                className="text-slate-200 group-hover:text-red-400 hover:text-red-500 p-1 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <input className="input text-sm w-full" placeholder="e.g. NOC from College"
              value={newLabel} onChange={e => { setNewLabel(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && add()} />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap cursor-pointer px-1">
            <input type="checkbox" className="w-4 h-4" checked={newRequired}
              onChange={e => setNewRequired(e.target.checked)} />
            Required
          </label>
          <button onClick={add} disabled={saving}
            className="btn-primary flex items-center gap-1 text-xs px-4 flex-shrink-0">
            {saving ? <Spinner size="sm" /> : <Plus className="w-3.5 h-3.5" />}Add
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Letter Formats ────────────────────────────────────────────────────────────
function LetterFormatsSection({ initial }) {
  const [formats, setFormats] = useState(initial)
  const [form, setForm] = useState({ department: '', header: '', signatory: '', footer: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  useEffect(() => { setFormats(initial) }, [initial])

  const save = async (list) => {
    setSaving(true)
    try {
      await hrApi.patchLetterFormats({ letter_formats: list })
      invalidateMastersCache()
      toast.success('Letter formats saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const add = () => {
    if (!form.department.trim()) { setError('Department required'); return }
    if (!form.signatory.trim()) { setError('Signatory required'); return }
    if (editIdx === null && formats.some(f => f.department === form.department.trim())) {
      setError('Format for this department already exists'); return
    }
    setError('')
    let updated
    if (editIdx !== null) {
      updated = formats.map((f, i) => i === editIdx ? { ...form } : f)
      setEditIdx(null)
    } else {
      updated = [...formats, { ...form }]
    }
    setFormats(updated)
    setForm({ department: '', header: '', signatory: '', footer: '' })
    save(updated)
  }

  const remove = (i) => {
    if (!window.confirm(`Delete format for "${formats[i].department}"?`)) return
    const updated = formats.filter((_, idx) => idx !== i)
    setFormats(updated)
    save(updated)
  }

  const startEdit = (i) => {
    setForm({ ...formats[i] })
    setEditIdx(i)
    setError('')
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Department Letter Formats</h2>
        <p className="text-xs text-slate-500 mt-0.5">Controls signatory name on offer letters and certificates per department. If not configured, defaults from settings are used.</p>
      </div>
      <div className="space-y-3">
        {formats.length === 0 && (
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No letter formats configured. Default settings will be used.
          </div>
        )}
        {formats.map((fmt, i) => (
          <div key={i} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-bold text-slate-800">{fmt.department}</p>
                {fmt.header && <p className="text-xs text-slate-500"><span className="text-slate-400 w-20 inline-block">Header:</span>{fmt.header}</p>}
                <p className="text-xs text-slate-500"><span className="text-slate-400 w-20 inline-block">Signatory:</span>{fmt.signatory}</p>
                {fmt.footer && <p className="text-xs text-slate-500"><span className="text-slate-400 w-20 inline-block">Footer:</span>{fmt.footer}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(i)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded transition-colors" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(i)} className="p-1.5 text-slate-300 hover:text-red-500 rounded transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionCard title={editIdx !== null ? `Editing: ${formats[editIdx]?.department}` : 'Add New Format'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Department *</label>
            <input className="input text-sm" placeholder="e.g. TRADC"
              value={form.department} onChange={e => { setForm(p => ({ ...p, department: e.target.value })); setError('') }}
              disabled={editIdx !== null} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Signatory Name *</label>
            <input className="input text-sm" placeholder="e.g. Sheba Banerjee"
              value={form.signatory} onChange={e => setForm(p => ({ ...p, signatory: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Header Text</label>
            <input className="input text-sm" placeholder="e.g. Grasim Industries Ltd. — TRADC Division"
              value={form.header} onChange={e => setForm(p => ({ ...p, header: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Footer / Address</label>
            <input className="input text-sm" placeholder="e.g. TRADC, Nagda, Madhya Pradesh"
              value={form.footer} onChange={e => setForm(p => ({ ...p, footer: e.target.value }))} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            {editIdx !== null && (
              <button onClick={() => { setEditIdx(null); setForm({ department: '', header: '', signatory: '', footer: '' }); setError('') }}
                className="btn-secondary text-xs flex items-center gap-1">
                <X className="w-3.5 h-3.5" />Cancel
              </button>
            )}
            <button onClick={add} disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-sm">
              {saving ? <Spinner size="sm" /> : editIdx !== null ? <><CheckCircle className="w-4 h-4" />Update Format</> : <><Plus className="w-4 h-4" />Add Format</>}
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Managers ──────────────────────────────────────────────────────────────────
function ManagersSection({ masters }) {
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', location: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(() => {
    hrApi.getManagers()
      .then(r => setManagers(r.data))
      .catch(() => toast.error('Failed to load managers'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', department: '', location: '' })
    setEditId(null)
    setError('')
    setShowForm(false)
  }

  const submit = async () => {
    if (!form.name.trim()) { setError('Name required'); return }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Valid email required'); return }
    if (!editId && !form.password.trim()) { setError('Password required for new manager'); return }
    setSaving(true)
    try {
      if (editId) {
        const payload = { name: form.name, email: form.email, department: form.department, location: form.location }
        if (form.password.trim()) payload.password = form.password
        await hrApi.updateManager(editId, payload)
        toast.success('Manager updated!')
      } else {
        await hrApi.createManager({ ...form })
        toast.success('Manager created! They can now log in.')
      }
      load()
      resetForm()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const deactivate = async (mgr) => {
    if (!window.confirm(`Deactivate ${mgr.name}? They won't be able to log in.`)) return
    try {
      await hrApi.deleteManager(mgr.id)
      toast.success('Manager deactivated')
      load()
    } catch { toast.error('Failed') }
  }

  const startEdit = (mgr) => {
    setForm({ name: mgr.name, email: mgr.email, password: '', department: mgr.department || '', location: mgr.location || '' })
    setEditId(mgr.id)
    setError('')
    setShowForm(true)
  }

  const depts = masters?.departments || []
  const locs = masters?.locations || []

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Managers</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage project managers who review intern performance. Managers log in at the same URL with their credentials.</p>
      </div>

      {/* Manager list */}
      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {managers.length === 0 && (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              No managers yet. Add one below.
            </div>
          )}
          {managers.map(mgr => (
            <div key={mgr.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">{mgr.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{mgr.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{mgr.email}</span>
                    {mgr.department && <span className="text-xs text-slate-400">{mgr.department}</span>}
                    {mgr.location && <span className="text-xs text-slate-400">{mgr.location}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(mgr)}
                  className="text-xs text-indigo-600 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" />Edit
                </button>
                <button onClick={() => deactivate(mgr)}
                  className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
                  <X className="w-3 h-3" />Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {!showForm && !editId && (
        <button onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />Add Manager
        </button>
      )}

      {(showForm || editId) && (
        <SectionCard title={editId ? 'Edit Manager' : 'Add New Manager'}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">Full Name *</label>
              <input className="input text-sm" placeholder="e.g. Gaurav Shrivastava"
                value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError('') }} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Email *</label>
              <input className="input text-sm" type="email" placeholder="gaurav@grasim.com"
                value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError('') }} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                {editId ? 'New Password (leave blank to keep)' : 'Password *'}
              </label>
              <input className="input text-sm" type="password" placeholder={editId ? 'Leave blank to keep current' : 'Set login password'}
                value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setError('') }} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Department</label>
              <select className="input text-sm" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                <option value="">Select department</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Location</label>
              <select className="input text-sm" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                <option value="">Select location</option>
                {locs.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="btn-secondary flex items-center gap-1 text-sm">
              <X className="w-3.5 h-3.5" />Cancel
            </button>
            <button onClick={submit} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Spinner size="sm" /> : editId ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editId ? 'Update Manager' : 'Create Manager'}
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ── Main MastersSettings with tabs ────────────────────────────────────────────
const TABS = [
  { id: 'departments',  label: 'Departments',      icon: Building2  },
  { id: 'locations',    label: 'Locations',         icon: MapPin     },
  { id: 'documents',    label: 'Documents',         icon: FileText   },
  { id: 'stipends',     label: 'Stipend Templates', icon: CreditCard },
  { id: 'formats',      label: 'Letter Formats',    icon: Award      },
  { id: 'assets',       label: 'Asset Types',       icon: Award      },
  { id: 'managers',     label: 'Managers',          icon: Users      },
]

export default function MastersSettings() {
  const [tab, setTab] = useState('departments')
  const [masters, setMasters] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hrApi.getMasters()
      .then(r => setMasters(r.data))
      .catch(() => toast.error('Failed to load masters'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  )

  if (!masters) return (
    <div className="text-center py-20 text-red-500">Failed to load masters data. Please refresh.</div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Masters & Settings"
        subtitle="Configure all system data. Each section saves directly to database on change."
      />

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px
              ${tab === t.id
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
           
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'departments' && <DepartmentsSection initial={masters.departments || []} />}
        {tab === 'locations'   && <LocationsSection   initial={masters.locations || []} />}
        {tab === 'documents'   && <DocumentsSection   initial={masters.document_checklist || []} />}
        {tab === 'stipends'    && <StipendSection     initial={masters.stipend_templates || []} />}
        {tab === 'formats'     && <LetterFormatsSection initial={masters.letter_formats || []} />}
        {tab === 'assets'      && <AssetTypesSection  initial={masters.asset_types || []} />}
        {tab === 'managers'    && <ManagersSection    masters={masters} />}
      </div>
    </div>
  )
}