import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyTerms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="community-heading text-4xl sm:text-5xl text-foreground mb-8">
          Privacy & Terms
        </h1>
        
        <div className="space-y-8">
          <Card>
            <CardContent className="p-6 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Who we are
                </h2>
                <p className="text-muted-foreground">
                  Outer Sunset Today is a project run by people who live in the Outer Sunset.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Privacy
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We don't sell or share your data.</p>
                  <p>We don't use tracking cookies.</p>
                  <p>
                    If you give us your contact information when submitting events or contacting us, 
                    we'll only use it for the purpose you expect (like following up about your event submission 
                    or responding to your inquiry).
                  </p>
                  <p>You can ask us to delete your information at any time.</p>
                  <p>This site is intended for people 14 and older.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Text Messages
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    If you sign up for text message updates, we will only text you about the specific updates you requested.
                    Message frequency varies depending on what you signed up for. Message and data rates may apply.
                  </p>
                  <p>
                    You can text STOP at any time to stop receiving messages, or text HELP for support.
                    We will not share your phone number with anyone.
                  </p>
                  <p>
                    To get help, you can also email us at{" "}
                    <a href="mailto:hello@relationaltechproject.org" className="text-primary hover:underline">
                      hello@relationaltechproject.org
                    </a>.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Terms of Use
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Please use this site with care and respect.</p>
                  <p>You are responsible for your own actions when participating in events and gatherings.</p>
                  <p>We don't endorse user-submitted content.</p>
                  <p>We accept no liability for what happens in and around this tool.</p>
                  <p>
                    This site is operated in CA, USA and any disputes are subject to its laws.
                  </p>
                  <p>
                    We may update these terms if needed, but we'll keep them simple and human.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Community Care
                </h2>
                <p className="text-muted-foreground">
                  We know things don't always go perfectly. If a misunderstanding or conflict arises, 
                  our volunteers are happy to help neighbors talk it through and find repair.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Questions?
                </h2>
                <p className="text-muted-foreground">
                  Reach us at{" "}
                  <a 
                    href="mailto:hello@relationaltechproject.org" 
                    className="text-primary hover:underline"
                  >
                    hello@relationaltechproject.org
                  </a>
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrivacyTerms;
