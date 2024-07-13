import React, { useState } from 'react';
import axios from 'axios';

const Signup: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [branch, setBranch] = useState('');
    const [currYear, setCurrYear] = useState('');
    const [yearOfJoining, setYearOfJoining] = useState('');
    const [password, setPassword] = useState('');
    const [acmMemberId, setAcmMemberId] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset previous errors and message
        setErrors({});
        setMessage('');

        // Validate form fields
        const newErrors: { [key: string]: string } = {};
        if (!fullName) newErrors.fullName = 'Full Name is required';
        if (!email) newErrors.email = 'Email is required';
        if (!phone) newErrors.phone = 'Phone number is required';
        if (!branch) newErrors.branch = 'Branch is required';
        if (!currYear) newErrors.currYear = 'Current year is required';
        if (!yearOfJoining) newErrors.yearOfJoining = 'Year of joining is required';
        if (!password) newErrors.password = 'Password is required';
        if (!acmMemberId) newErrors.acmMemberId = 'ACM Member ID is required';

        // If there are errors, set them and return
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Prepare user data
        const userData = {
          fullName, email, phone, branch,
          currYear, yearOfJoining, password,
          acmMemberId
        };

        try {
            // Send request to the backend
            const response = await axios.post('http://localhost:3000/api/auth/signup', userData);
            setMessage(response.data);
        } catch (error: unknown) {
          if (error instanceof Error) {
              const axiosError = error as { response?: { data?: string } };
              if (axiosError.response && axiosError.response.data) {
                  setErrors({ form: axiosError.response.data });
              } else {
                  setErrors({ form: error.message });
              }
          } else {
              setErrors({ form: 'An unknown error occurred' });
          }
      }
    };

    return (
        <div>
            <h2>Sign Up</h2>
            {message && <p>{message}</p>}
            {errors.form && <p>{errors.form}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    {errors.fullName && <p>{errors.fullName}</p>}
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {errors.email && <p>{errors.email}</p>}
                </div>
                <div>
                    <label>Phone</label>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    {errors.phone && <p>{errors.phone}</p>}
                </div>
                <div>
                    <label>Branch</label>
                    <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                    />
                    {errors.branch && <p>{errors.branch}</p>}
                </div>
                <div>
                    <label>Current Year</label>
                    <input
                        type="text"
                        value={currYear}
                        onChange={(e) => setCurrYear(e.target.value)}
                    />
                    {errors.currYear && <p>{errors.currYear}</p>}
                </div>
                <div>
                    <label>Year of Joining</label>
                    <input
                        type="text"
                        value={yearOfJoining}
                        onChange={(e) => setYearOfJoining(e.target.value)}
                    />
                    {errors.yearOfJoining && <p>{errors.yearOfJoining}</p>}
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors.password && <p>{errors.password}</p>}
                </div>
                <div>
                    <label>ACM Member ID</label>
                    <input
                        type="text"
                        value={acmMemberId}
                        onChange={(e) => setAcmMemberId(e.target.value)}
                    />
                    {errors.acmMemberId && <p>{errors.acmMemberId}</p>}
                </div>
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
};

export default Signup;
