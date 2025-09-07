import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
  CreditCard,
  Check,
  MapPin,
  Star
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BookingStep {
  id: number;
  title: string;
  description: string;
}

const BookingFlow = () => {
  const { experienceId } = useParams<{ experienceId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [experience, setExperience] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking form data
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [participants, setParticipants] = useState(1);
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  const steps: BookingStep[] = [
    { id: 1, title: 'Select Date & Time', description: 'Choose when you want to join' },
    { id: 2, title: 'Guest Information', description: 'Tell us about yourself' },
    { id: 3, title: 'Payment', description: 'Complete your booking' },
    { id: 4, title: 'Confirmation', description: 'You\'re all set!' }
  ];

  useEffect(() => {
    if (experienceId) {
      fetchExperience();
    }
  }, [experienceId]);

  const fetchExperience = async () => {
    try {
      // Demo experience data
      const demoExperience = {
        id: experienceId,
        title: 'Virtual Vatican Museums Tour',
        description: 'Take an exclusive virtual tour through the Vatican Museums with art historian Elena Rossi.',
        creator: {
          id: 'demo-1',
          full_name: 'Elena Rossi',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face',
          service_rating: 4.8
        },
        price_usd: 35,
        duration_minutes: 90,
        max_participants: 15,
        location: 'Vatican City (Virtual)',
        category: 'Museums',
        image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800'
      };

      setExperience(demoExperience);
    } catch (error) {
      console.error('Error fetching experience:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load experience details.",
      });
      navigate('/experiences');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && (!selectedDate || !selectedTime)) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please select both date and time.",
      });
      return;
    }

    if (currentStep === 2) {
      const { firstName, lastName, email } = guestInfo;
      if (!firstName || !lastName || !email) {
        toast({
          variant: "destructive",
          title: "Required fields missing",
          description: "Please fill in all required guest information.",
        });
        return;
      }
    }

    if (currentStep === 3) {
      // Process payment
      handlePayment();
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePayment = async () => {
    try {
      // Demo payment processing
      toast({
        title: "Processing payment...",
        description: "Please wait while we process your booking.",
      });

      // Simulate payment delay
      setTimeout(() => {
        setCurrentStep(4);
        toast({
          title: "Booking confirmed!",
          description: "You'll receive a confirmation email shortly.",
        });
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "There was an issue processing your payment. Please try again.",
      });
    }
  };

  const formatPrice = (price: number) => `$${price}`;
  const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  const availableTimes = [
    '09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-96 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Experience not found</h1>
            <Button onClick={() => navigate('/experiences')} className="mt-4">
              Back to Experiences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{steps[currentStep - 1].title}</h2>
            <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Date & Time Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                    </div>

                    {selectedDate && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Available Times</h3>
                        <div className="grid grid-cols-4 gap-3">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? 'default' : 'outline'}
                              onClick={() => setSelectedTime(time)}
                              className="w-full"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="participants">Number of Participants</Label>
                      <Input
                        id="participants"
                        type="number"
                        min="1"
                        max={experience.max_participants}
                        value={participants}
                        onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Maximum {experience.max_participants} participants
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Guest Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={guestInfo.firstName}
                          onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={guestInfo.lastName}
                          onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        value={guestInfo.specialRequests}
                        onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                        placeholder="Any special requests or accessibility needs?"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Payment Information</h3>
                    
                    <div>
                      <Label htmlFor="nameOnCard">Name on Card</Label>
                      <Input
                        id="nameOnCard"
                        value={paymentInfo.nameOnCard}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, nameOnCard: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={paymentInfo.expiryDate}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={paymentInfo.cvv}
                          onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Your payment is secure and encrypted. You'll receive a confirmation email immediately after booking.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 4 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h3>
                      <p className="text-muted-foreground">
                        Your booking has been confirmed. You'll receive a confirmation email with joining instructions.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Button onClick={() => navigate('/experiences')} className="w-full">
                        Browse More Experiences
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/library')} className="w-full">
                        View My Bookings
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <Button onClick={handleNext}>
                  {currentStep === 3 ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Complete Booking
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <img 
                    src={experience.image_url} 
                    alt={experience.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{experience.title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-current text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{experience.creator.service_rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{experience.creator.full_name}</p>
                  </div>
                </div>

                {selectedDate && selectedTime && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{participants} participant{participants > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{experience.location}</span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price per person</span>
                    <span>{formatPrice(experience.price_usd)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Participants × {participants}</span>
                    <span>{formatPrice(experience.price_usd * participants)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service fee</span>
                    <span>{formatPrice(5)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(experience.price_usd * participants + 5)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;