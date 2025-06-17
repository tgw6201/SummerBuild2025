import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    gender: "",
    weight: "",
    height: "",
    date_of_birth: "",
    allergies: "",
    dietary_preference: "",
    calorie_goal: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "gender") {
        processedValue = value.toLowerCase(); // force lowercase
    }
    // Allow only positive integers for weight and height
    if ((name === "weight" || name === "height" || name === "calorie_goal") && value !== "") {
      if (!/^\d+$/.test(value)) return; // Block non-numeric or negative input
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const { gender, weight, height } = formData;

    // Gender validation: allow only 'male' or 'female' (case-insensitive)
    const genderValid = ["male", "female"].includes(gender.toLowerCase());

    if (!genderValid) {
      alert("Gender must be 'male' or 'female'");
      return;
    }

    if (parseInt(weight) <= 0 || parseInt(height) <= 0) {
      alert("Weight and Height must be positive numbers");
      return;
    }

    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // Include cookies for session management
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Submission failed");
        return;
      }

      navigate("/dashboard");

    } catch (err) {
      console.error("Error submitting onboarding:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <main className="onboarding-form">
      <form onSubmit={handleSubmit}>
        <h2>Onboarding</h2>

        {step === 1 && (
          <>
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            {/* GENDER DROPDOWN: MALE / FEMALE ONLY */}
            <select
            name="gender"
            className="form-select form-select-sm"
            value={formData.gender}
            onChange={handleChange}
            required
            >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            </select>
            <input
              type="text"
              name="weight"
              placeholder="Weight (kg)"
              value={formData.weight}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="height"
              placeholder="Height (cm)"
              value={formData.height}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
            <button className="btn btn-dark" type="button" onClick={handleNext}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              name="allergies"
              placeholder="Allergies (comma separated)"
              value={formData.allergies}
              onChange={handleChange}
            />
            <input
              type="text"
              name="dietary_preference"
              placeholder="Dietary Preference (e.g. Vegan)"
              value={formData.dietary_preference}
              onChange={handleChange}
            />
            <input
              type="text"
              name="calorie_goal"
              placeholder="Daily Calorie Goal"
              value={formData.calorie_goal}
              onChange={handleChange}
            />
            <button className="btn btn-dark" type="button" onClick={handleBack}>Back</button>
            <button className="btn btn-dark" type="submit">Submit</button>
          </>
        )}
      </form>
    </main>
  );
}
