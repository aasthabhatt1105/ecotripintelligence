import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Award, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function BadgeClaimModal({ eligible, onClose, totalPoints }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: '',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.BadgeOrder.create({
        ...formData,
        badge_type: 'eco_champion_2000',
        status: 'claimed',
        claimed_date: new Date().toISOString()
      });
      setStep(3);
    } catch (error) {
      console.error('Error claiming badge:', error);
      setLoading(false);
    }
  };

  if (!eligible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border/50 max-w-md w-full shadow-xl"
      >
        {step === 1 && (
          <div className="p-8 text-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
            >
              <Award className="w-12 h-12 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-2">EcoTrip Champion! 🏆</h2>
              <p className="text-muted-foreground">You've earned your physical badge for reaching {totalPoints} eco points!</p>
            </div>
            <div className="bg-primary/5 rounded-2xl p-4 text-sm">
              <p className="font-semibold mb-2">What's included:</p>
              <ul className="text-left space-y-1 text-xs">
                <li>✓ Premium EcoTrip Champion medal</li>
                <li>✓ Personalized certificate</li>
                <li>✓ Free worldwide shipping</li>
              </ul>
            </div>
            <Button onClick={() => setStep(2)} className="w-full h-12 rounded-2xl">
              Claim Your Badge <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <Input
              name="recipient_name"
              placeholder="Full Name"
              value={formData.recipient_name}
              onChange={handleInputChange}
              className="rounded-2xl"
              required
            />
            <Input
              name="street_address"
              placeholder="Street Address"
              value={formData.street_address}
              onChange={handleInputChange}
              className="rounded-2xl"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                className="rounded-2xl"
                required
              />
              <Input
                name="state_province"
                placeholder="State/Province"
                value={formData.state_province}
                onChange={handleInputChange}
                className="rounded-2xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="postal_code"
                placeholder="Postal Code"
                value={formData.postal_code}
                onChange={handleInputChange}
                className="rounded-2xl"
              />
              <Input
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleInputChange}
                className="rounded-2xl"
                required
              />
            </div>
            <Input
              name="phone"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleInputChange}
              className="rounded-2xl"
              type="tel"
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-2xl h-11">
                Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 rounded-2xl h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Order'}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="p-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
            >
              <span className="text-4xl">✓</span>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Badge Claimed! 🎉</h2>
              <p className="text-muted-foreground">Your EcoTrip Champion medal is being prepared and will ship within 7-10 business days.</p>
            </div>
            <p className="text-xs text-muted-foreground">You'll receive a tracking number via email.</p>
            <Button onClick={onClose} className="w-full h-12 rounded-2xl">
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}