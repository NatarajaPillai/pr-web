import React, { useState } from 'react';
import { LandParcel, UnitDetail } from '../types';
import { formatInr } from '../utils/cadastreUtils';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  User 
} from 'lucide-react';

interface EnquiryModalProps {
  parcel: LandParcel;
  unit?: UnitDetail | null;
  onClose: () => void;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  parcel,
  unit,
  onClose,
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>('');
  const [message, setMessage] = useState<string>(
    unit
      ? `Interested in scheduling an on-site inspection and reviewing technical title documents for ${unit.unitNumber} (${unit.type}) at ${parcel.building?.name || parcel.surveyNumber}.`
      : `Requesting legal due diligence report and ULPIN cadastral survey extract for ${parcel.surveyNumber}, ${parcel.talukVillage}.`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in your name, email, and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: parcel.id,
          parcelUlpin: parcel.ulpin,
          unitId: unit?.id,
          unitNumber: unit?.unitNumber,
          name,
          email,
          phone,
          message: preferredDate ? `${message} (Preferred Date: ${preferredDate})` : message,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to record inquiry');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Inspection Request Confirmed</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Thank you, <strong>{name}</strong>. Our certified cadastral relationship manager has received your
              dossier request for <strong>{unit ? unit.unitNumber : parcel.ulpin}</strong>.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-amber-300 border border-slate-800">
              Reference Token: CAD-REQ-{Date.now().toString().slice(-6)}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div>
              <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
                Cadastral Inquiry & Site Visit
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {unit ? `Schedule Visit for ${unit.unitNumber}` : `Inquire: ${parcel.surveyNumber}`}
              </h3>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {parcel.talukVillage}, {parcel.district}, {parcel.state} (ULPIN: {parcel.ulpin})
                </span>
              </p>
            </div>

            {/* Target Spec Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px]">Property / Tower</span>
                <div className="font-semibold text-slate-200">
                  {parcel.building ? parcel.building.name : 'Open Land Parcel'}
                </div>
              </div>
              {unit && (
                <div className="text-right">
                  <span className="text-slate-400 text-[11px]">Pricing</span>
                  <div className="font-mono font-bold text-amber-300 text-sm">
                    {formatInr(unit.priceLakhs)}
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikramaditya Rathore"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vikram@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Phone Number (+91) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Preferred Inspection Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Specific Requirements or Queries</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
