import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";
import FormContainer from "../components/FormContainer";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterUserMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import { toast } from "react-toastify";

const RegisterScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validated, setValidated] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState("");
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate("/");
    }
  }, [navigate, userInfo]);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Standard email validation regex
    return emailRegex.test(value);
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);

    if (password && value !== password) {
      setPasswordMatchError("Passwords do not match");
    } else {
      setPasswordMatchError("");
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Please provide a valid email");
      setValidated(false);
      return;
    } else if (password !== confirmPassword) { 
      toast.error("Passwords do not match");
      setValidated(false);
      return;
    } else if (!username || !email || !password || !confirmPassword) {
      toast.error("Please fill all the fields");
      setValidated(false);
      return;
    } else {
      setValidated(true);
    }

    try {
      const response = await registerUser({
        username,
        email,
        password,
      }).unwrap();
      dispatch(setCredentials({ ...response }));
      navigate("/");
    } catch (error) {
      toast.error(error?.data?.message || error.message);
    }
  };

  return (
    <FormContainer>
      <h1>Sign Up</h1>
      <Form noValidate validated={validated} onSubmit={submitHandler}>
        <Form.Group className="my-2" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="username"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Form.Control.Feedback type="invalid">
            {"Please provide a valid username"}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="my-2" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
            isInvalid={!!emailError}
          />
          <Form.Control.Feedback type="invalid">
            {emailError || "Please provide a valid email"}
          </Form.Control.Feedback>
        </Form.Group>
        <Form.Group className="my-2" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="my-2" controlId="confirmPassword">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter Confirm Password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            required
            isInvalid={!!passwordMatchError}
          />
          <Form.Control.Feedback type="invalid">
            {passwordMatchError}
          </Form.Control.Feedback>
        </Form.Group>

        <Button
          type="submit"
          variant="dark"
          className="my-2"
          disabled={isLoading}
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : ""}
          Register
        </Button>

        <Row className="py-3">
          <Col>
            Already have an account? <Link to="/login">Login</Link>
          </Col>
        </Row>
      </Form>
    </FormContainer>
  );
};

export default RegisterScreen;
