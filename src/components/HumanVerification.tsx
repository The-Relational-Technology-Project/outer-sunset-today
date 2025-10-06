import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface HumanVerificationProps {
  onVerified: (isVerified: boolean) => void;
  resetTrigger?: number;
}

export const HumanVerification = ({ onVerified, resetTrigger = 0 }: HumanVerificationProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");

  useEffect(() => {
    // Generate new random numbers between 1 and 10
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer("");
    onVerified(false);
  }, [resetTrigger]);

  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(value) === correctAnswer;
    onVerified(isCorrect);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`verification-${resetTrigger}`}>
        Human Verification: What is {num1} + {num2}?
      </Label>
      <Input
        id={`verification-${resetTrigger}`}
        type="number"
        value={userAnswer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Enter the answer"
        required
      />
    </div>
  );
};
