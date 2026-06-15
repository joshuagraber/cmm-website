import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactFormPreview() {
  return (
    <form
      className="grid gap-10"
      aria-labelledby="contact-form-heading"
      action="/api/contact"
      method="post"
    >
      <h3 id="contact-form-heading" className="sr-only">
        Contact form
      </h3>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          name="company"
          autoComplete="off"
          tabIndex={-1}
        />
      </div>
      <fieldset className="grid gap-6">
        <legend className="text-lg font-medium">Name</legend>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="grid gap-3">
            <Label htmlFor="first-name">
              First Name{" "}
              <span className="text-muted-foreground" aria-hidden="true">
                (required)
              </span>
            </Label>
            <Input
              id="first-name"
              name="given-name"
              autoComplete="given-name"
              placeholder="First name"
              required
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="last-name">
              Last Name{" "}
              <span className="text-muted-foreground" aria-hidden="true">
                (required)
              </span>
            </Label>
            <Input
              id="last-name"
              name="family-name"
              autoComplete="family-name"
              placeholder="Last name"
              required
            />
          </div>
        </div>
      </fieldset>
      <div className="grid gap-3">
        <Label htmlFor="email">
          Email{" "}
          <span className="text-muted-foreground" aria-hidden="true">
            (required)
          </span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="message">
          Message{" "}
          <span className="text-muted-foreground" aria-hidden="true">
            (required)
          </span>
        </Label>
        <Textarea
          id="message"
          name="message"
          autoComplete="off"
          placeholder="Tell us what you are working on, pitching, or curious about."
          required
        />
      </div>
      <div>
        <Button type="submit">Send</Button>
      </div>
    </form>
  );
}
