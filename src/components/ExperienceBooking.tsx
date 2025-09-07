import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, MapPin, Calendar as CalendarIcon, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LiveExperience {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  experience_type: string;
  duration_minutes: number;
  price_usd: number;
  max_participants: number;
  location?: string;
  image_url?: string;
  requirements?: string;
  included_items?: string;
  language: string;
  creator: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ExperienceBookingProps {
  experience: LiveExperience;
  onBookingComplete?: (bookingId: string) => void;
}

export const ExperienceBooking: React.FC<ExperienceBookingProps> = ({
  experience,
  onBookingComplete
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [participants, setParticipants] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatorAvailability, setCreatorAvailability] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (experience) {
      fetchCreatorAvailability();
    }
  }, [experience]);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableSlots(selectedDate);
    }
  }, [selectedDate, creatorAvailability]);

  const fetchCreatorAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_availability')
        .select('*')
        .eq('creator_id', experience.creator_id)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching availability:', error);
        return;
      }

      setCreatorAvailability(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateAvailableSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const availabilityForDay = creatorAvailability.filter(
      av => av.day_of_week === dayOfWeek
    );

    if (availabilityForDay.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots: string[] = [];
    availabilityForDay.forEach(availability => {
      const startTime = new Date(`2000-01-01T${availability.start_time}`);
      const endTime = new Date(`2000-01-01T${availability.end_time}`);
      const slotDuration = availability.slot_duration_minutes;

      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const timeString = currentTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        slots.push(timeString);
        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }
    });

    setAvailableSlots(slots);
  };

  const formatPrice = (price: number) => `$${price}`;
  const totalPrice = experience.price_usd * participants;

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getExperienceTypeLabel = (type: string) => {
    switch (type) {
      case 'virtual_tour': return 'Virtual Tour';
      case 'live_walkthrough': return 'Live Walkthrough';
      case 'cultural_experience': return 'Cultural Experience';
      case 'cooking_class': return 'Cooking Class';
      default: return type;
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book an experience",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Create a datetime for the scheduled experience
      const scheduledDateTime = new Date(selectedDate);
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let adjustedHours = hours;
      if (period === 'PM' && hours !== 12) adjustedHours += 12;
      if (period === 'AM' && hours === 12) adjustedHours = 0;
      
      scheduledDateTime.setHours(adjustedHours, minutes, 0, 0);

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('experience_bookings')
        .insert({
          user_id: user.id,
          experience_id: experience.id,
          creator_id: experience.creator_id,
          booking_date: new Date().toISOString(),
          scheduled_for: scheduledDateTime.toISOString(),
          participants_count: participants,
          total_price: totalPrice,
          special_requests: specialRequests || null,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (bookingError) {
        console.error('Booking error:', bookingError);
        toast({
          title: "Booking Failed",
          description: "Failed to create booking. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Here you would integrate with Stripe for payment
      // For now, we'll just show success
      toast({
        title: "Booking Created!",
        description: "Your experience has been booked. Payment processing coming soon!",
      });

      if (onBookingComplete) {
        onBookingComplete(booking.id);
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Experience Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {experience.image_url && (
                <img 
                  src={experience.image_url} 
                  alt={experience.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{experience.title}</h2>
                <p className="text-sm text-muted-foreground">
                  with {experience.creator.full_name}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{experience.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{formatDuration(experience.duration_minutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Max {experience.max_participants}</span>
              </div>
              {experience.location && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{experience.location}</span>
                </div>
              )}
            </div>

            <Badge variant="secondary">
              {getExperienceTypeLabel(experience.experience_type)}
            </Badge>

            {experience.requirements && (
              <div>
                <h4 className="font-medium mb-2">Requirements:</h4>
                <p className="text-sm text-muted-foreground">{experience.requirements}</p>
              </div>
            )}

            {experience.included_items && (
              <div>
                <h4 className="font-medium mb-2">What's Included:</h4>
                <p className="text-sm text-muted-foreground">{experience.included_items}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Book Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div>
              <h4 className="font-medium mb-3">Select Date</h4>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div>
                <h4 className="font-medium mb-3">Select Time</h4>
                {availableSlots.length > 0 ? (
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    No available time slots for this date
                  </p>
                )}
              </div>
            )}

            {/* Participants */}
            <div>
              <h4 className="font-medium mb-3">Number of Participants</h4>
              <Select 
                value={participants.toString()} 
                onValueChange={(value) => setParticipants(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: experience.max_participants }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} participant{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special Requests */}
            <div>
              <h4 className="font-medium mb-3">Special Requests (Optional)</h4>
              <Textarea
                placeholder="Any special requirements or questions..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Price per person:</span>
                <span>{formatPrice(experience.price_usd)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Participants:</span>
                <span>{participants}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>

            <Button 
              onClick={handleBooking} 
              disabled={!selectedDate || !selectedTime || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Book Experience - {formatPrice(totalPrice)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};