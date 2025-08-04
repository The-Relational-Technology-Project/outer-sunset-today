import { Card, CardContent } from "@/components/ui/card";

const ArizmendiBoardWidget = () => {
  // Get current date for demo purposes
  const getCurrentPizza = () => {
    const today = new Date();
    const day = today.getDate();
    
    // August 2025 pizza schedule based on the calendar
    const pizzaSchedule: { [key: number]: string } = {
      1: "shiitake, portabella and button mushrooms with sesame-ginger-garlic vinaigrette, parsley",
      2: "house-made tomato sauce, spinach, feta, thyme oil, parmesan",
      3: "tomatoes, sweet corn, white cheddar, lime oil, p&p",
      5: "kalamata olives, spinach, feta, garlic oil, parmesan",
      6: "mushrooms, red onions, feta, thyme oil, p&p",
      7: "sugar plum and honey bunch tomatoes, goat cheese, garlic oil, basil and parmesan",
      8: "house-made tomato sauce with basil pesto",
      9: "crimini mushrooms, feta, gruyere, garlic oil, p&p",
      10: "marinated artichoke hearts, spinach, fontina, lemon-thyme oil, p&p",
      12: "caramelized onions, ricotta cheese, basil pesto",
      13: "heirloom tomatoes, spinach, feta cheese, fresh basil",
      14: "roasted gold potatoes, spinach, sharp cheddar, rosemary oil, chives & parmesan",
      15: "mushrooms,leeks, manchego cheese, garlic oil, p&p",
      16: "house-made sauce, feta, fontina, parsley+parmesan with balsamic vinaigrette",
      17: "spinach, red onions,goat cheese",
      19: "mixed summer squash,garlic-olive oil, ricotta spread, lemon oil, parsley + parmesan",
      20: "marinated artichoke hearts,spinach, smoked gouda, thyme oil, parsley + parmesan",
      21: "poblanos, corn, peppers jack,lime oil, parm",
      22: "Cherry tomatoes, mix greens, feta, thyme oil, p&p",
      23: "Mushrooms,kale, basil pesto, fontina, p&p",
      24: "Shiitake, portabella, and button mushrooms, sesame-ginger-garlic vinaigrette",
      26: "asparagus, red onion, balsamic vinaigrette, goat cheese",
      27: "house-made tomato sauce, pineapple, yellow bell pepper, gouda, parsley",
      28: "artichokes, spinach,garlic-herb-ricotta, p&p",
      29: "Mushrooms, mixed greens, lemon herb vinaigrette, p&p",
      30: "Roasted potatoes, kale, gouda, rosemary oil, p&p",
      31: "Sun dried tomatoes, mix greens, goat cheese, rosemary oil, p&p"
    };

    return pizzaSchedule[day] || "Check in-store for today's special!";
  };

  return (
    <Card className="bg-paper border-cork shadow-bulletin transform rotate-[-0.5deg] mb-6">
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <span className="text-lg">🍕</span>
          <h3 className="text-lg font-bold text-foreground ml-2 font-bulletin">
            Arizmendi Pizza Today
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-handwritten leading-relaxed">
          {getCurrentPizza()}
        </p>
        <div className="text-xs text-muted-foreground mt-2 font-bulletin">
          1331 9th Ave • Open 7am-7pm
        </div>
      </CardContent>
    </Card>
  );
};

export default ArizmendiBoardWidget;