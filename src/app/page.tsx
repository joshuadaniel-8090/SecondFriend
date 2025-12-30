
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope, Users, Lock, MessageSquare, ShieldCheck, Scalability, Zap, Instagram, Linkedin, Twitter, Facebook } from 'lucide-react';
import Header from '@/components/shared/Header';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/auth-redirect');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return null; // or a loading component, while redirecting
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-card w-full py-20 md:py-32">
          <div className="container mx-auto text-center px-4">
            <Stethoscope className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter mb-4">
              Empowering Student Wellness, Anonymously.
            </h1>
            <p className="max-w-3xl mx-auto text-muted-foreground text-lg md:text-xl mb-8">
              Second Friend provides a secure and confidential bridge between students and licensed mental health professionals. Our platform is designed to deliver immediate, text-based support, ensuring that seeking help is simple, private, and stigma-free.
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/signup">
                <Button size="lg">Get Started</Button>
                </Link>
                <Link href="/login">
                <Button size="lg" variant="outline">Login</Button>
                </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">The Future of Student Support</h2>
              <p className="text-muted-foreground text-lg mt-2 max-w-2xl mx-auto">A scalable, secure, and user-centric platform designed for the next generation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 font-headline">Enterprise-Grade Security</h3>
                <p className="text-muted-foreground">Built on a foundation of privacy, all conversations are end-to-end encrypted. We are committed to protecting user anonymity and ensuring data is never compromised.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 font-headline">Vetted Professional Network</h3>
                <p className="text-muted-foreground">Our counsellors are licensed, rigorously vetted, and trained to provide high-quality, empathetic support tailored to the unique challenges students face today.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 font-headline">On-Demand Text-Based Chat</h3>
                <p className="text-muted-foreground">Accessible and discreet, our platform enables students to connect with a counsellor in real-time, from any device, removing the barriers of scheduling and location.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-card w-full py-20 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">Simple, Confidential, and Effective</h2>
                    <p className="text-muted-foreground text-lg mt-2 max-w-2xl mx-auto">A streamlined process for immediate support.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="border p-8 rounded-lg shadow-sm">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold text-2xl">1</div>
                        <h3 className="text-xl font-semibold mb-2">Request a Session</h3>
                        <p className="text-muted-foreground">Students create an anonymous request detailing their concerns, choosing a relevant category like stress, academics, or relationships.</p>
                    </div>
                    <div className="border p-8 rounded-lg shadow-sm">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold text-2xl">2</div>
                        <h3 className="text-xl font-semibold mb-2">Counsellor Connect</h3>
                        <p className="text-muted-foreground">A qualified counsellor from our network accepts the request, initiating a secure and private text-based chat session.</p>
                    </div>
                    <div className="border p-8 rounded-lg shadow-sm">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mx-auto mb-4 font-bold text-2xl">3</div>
                        <h3 className="text-xl font-semibold mb-2">Get Support</h3>
                        <p className="text-muted-foreground">Receive real-time, one-on-one guidance and support from a licensed professional in a safe and confidential environment.</p>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Mission Section */}
        <section className="w-full py-20 md:py-24">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Our Mission: A Healthier Tomorrow</h2>
              <p className="text-muted-foreground text-lg mt-4">
                Student mental health is at a critical juncture. The pressure of academics, social life, and future uncertainties can be overwhelming. Traditional support systems are often overburdened, inaccessible, or carry a stigma that prevents students from seeking help.
              </p>
              <p className="text-muted-foreground text-lg mt-4">
                Second Friend was built to dismantle these barriers. We leverage technology to create a scalable, accessible, and truly private mental wellness ecosystem for educational institutions. By empowering students to take control of their mental health journey, we are fostering a healthier, more resilient generation.
              </p>
            </div>
            <div className="flex justify-center">
                <img src="https://picsum.photos/seed/future/600/400" alt="Students collaborating" className="rounded-lg shadow-lg" data-ai-hint="team collaboration"/>
            </div>
          </div>
        </section>

         {/* Call to Action Section */}
        <section className="bg-primary/10 w-full py-20 md:py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="max-w-3xl mx-auto text-muted-foreground text-lg md:text-xl mb-8">
              Join Second Friend today. Whether you're a student seeking support or a university looking to enhance your wellness services, we have a solution for you.
            </p>
            <Link href="/signup">
              <Button size="lg">Join Now</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-2 text-primary mb-4 md:mb-0">
                    <Stethoscope size={28} />
                    <h2 className="font-headline text-2xl font-bold">Second Friend</h2>
                </div>
                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4 md:mb-0">
                    <Link href="#" className="hover:underline hover:text-primary">Privacy Policy</Link>
                    <Link href="#" className="hover:underline hover:text-primary">Terms of Service</Link>
                    <Link href="mailto:contact@secondfriend.com" className="hover:underline hover:text-primary">Contact Us</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link href="#" aria-label="Twitter"><Twitter className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>
                    <Link href="#" aria-label="LinkedIn"><Linkedin className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>
                    <Link href="#" aria-label="Instagram"><Instagram className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>
                    <Link href="#" aria-label="Facebook"><Facebook className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>
                </div>
            </div>
            <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Second Friend. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
