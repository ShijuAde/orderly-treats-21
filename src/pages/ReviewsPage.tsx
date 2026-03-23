import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';

const ReviewsPage = () => {
  const { reviews, addReview } = useCartStore();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    addReview({
      id: Date.now().toString(),
      name,
      rating,
      comment,
      date: new Date().toISOString(),
    });
    setName('');
    setComment('');
    setRating(5);
    toast({ title: '🙏 Thank you!', description: 'Your review has been submitted.' });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold">Customer Reviews</h1>
        <p className="mt-1 text-muted-foreground">See what our customers say about us</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Review form */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <MessageSquare className="h-5 w-5" /> Leave a Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="review-name">Your Name</Label>
                  <Input
                    id="review-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <Label>Rating</Label>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoveredStar(s)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(s)}
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            s <= (hoveredStar || rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="review-comment">Comment</Label>
                  <Textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit Review
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Reviews list */}
          <div className="space-y-4 lg:col-span-2">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{review.name}</h3>
                          <div className="mt-1 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-4 w-4 ${
                                  s <= review.rating
                                    ? 'fill-primary text-primary'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
