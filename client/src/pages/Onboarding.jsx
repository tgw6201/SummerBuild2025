import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [form, setForm] = useState({
    phone: "",
    name: "",
    gender: "",
    weight: "",
    height: "",
    dob: "",
    allergies: "",
    dietary_preference: "",
    calorie_goal: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      let newAllergies = [...form.allergies];
      if (e.target.checked) {
        newAllergies.push(value);
      } else {
        newAllergies = newAllergies.filter(a => a !== value);
      }
      setForm({ ...form, allergies: newAllergies });
    } else {
      setForm({ ...form, [name]: value });
    }
    setError("");
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.phone || !form.name || !form.gender || !form.weight || !form.height || !form.dob || !form.dietary_preference || !form.calorie_goal) {
      setError("Please fill in all required fields.");
      return;
    }
    alert("Onboarding complete!");
    navigate("/chatbot");
  };

  return (
    <main className="form-signin text-center">
      <form onSubmit={handleSubmit} autoComplete="off">
        <h1 className="title">Welcome to RennyBot!</h1>
        <h2 className="h4 mb-3 fw-normal">Let's set up your profile</h2>

        <div className="form-floating">
          <input
            type="tel"
            className="form-control"
            id="floatingPhone"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
          />
          <label htmlFor="floatingPhone">Phone Number</label>
        </div>

        <div className="form-floating">
          <input
            type="text"
            className="form-control"
            id="floatingName"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <label htmlFor="floatingName">Name</label>
        </div>

        <div className="form-floating">
          <select
            className="form-control"
            id="floatingGender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
          <label htmlFor="floatingGender">Gender</label>
        </div>

        <div className="form-floating">
          <input
            type="number"
            className="form-control"
            id="floatingWeight"
            name="weight"
            placeholder="Weight (kg)"
            value={form.weight}
            onChange={handleChange}
            min="1"
            required
          />
          <label htmlFor="floatingWeight">Weight (kg)</label>
        </div>

        <div className="form-floating">
          <input
            type="number"
            className="form-control"
            id="floatingHeight"
            name="height"
            placeholder="Height (cm)"
            value={form.height}
            onChange={handleChange}
            min="1"
            required
          />
          <label htmlFor="floatingHeight">Height (cm)</label>
        </div>

        <div className="form-floating">
          <input
            type="date"
            className="form-control"
            id="floatingDOB"
            name="dob"
            placeholder="Date of Birth"
            value={form.dob}
            onChange={handleChange}
            required
          />
          <label htmlFor="floatingDOB">Date of Birth</label>
        </div>

        <div className="form-floating">
            <input
                type="text"
                className="form-control"
                id="floatingDiet"
                name="dietary_preference"
                placeholder="Dietary Preference"
                value={form.dietary_preference}
                onChange={handleChange}
                required
            />
            <label htmlFor="floatingDiet">Dietary Preference</label>
        </div>

        <div className="form-floating">
            <input
                type="text"
                className="form-control"
                name="allergies"
                placeholder="Allergies (comma separated)"
                value={form.allergies}
                onChange={handleChange}
            />
            <label>Allergies (comma separated)</label>
        </div>

        <div className="form-floating">
          <input
            type="number"
            className="form-control"
            id="floatingCalorieGoal"
            name="calorie_goal"
            placeholder="Daily Calorie Goal"
            value={form.calorie_goal}
            onChange={handleChange}
            min="1"
            required
          />
          <label htmlFor="floatingCalorieGoal">Daily Calorie Goal</label>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn btn-primary w-100 py-2" type="submit">
          Finish Onboarding
        </button>
      </form>
    </main>
  );
}