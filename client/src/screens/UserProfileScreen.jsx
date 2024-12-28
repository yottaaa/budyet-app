import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { z } from "zod";
import { toast } from "react-toastify";
import {
  useGetUserProfileMutation,
  useUpdateUserProfileMutation,
} from "../slices/usersApiSlice";
import { Eye, EyeOff } from "lucide-react";

const userSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const UserProfileScreen = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [getUserProfile, { isLoading: isGetUserProfileLoading }] =
    useGetUserProfileMutation();
  const [updateUserProfile, { isLoading: isUpdateUserProfileLoading }] =
    useUpdateUserProfileMutation();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" })); // Clear error on change
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      let data = {};
      if (changePassword) {
        data = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        };
      } else {
        data = {
          username: formData.username,
          email: formData.email,
        };
      }

      userSchema.parse(data);

      await updateUserProfile(data).unwrap();

      toast.success("Update user profile success");
    } catch (err) {
      const validationErrors = {};
      if (err.errors) {
        err.errors.forEach((error) => {
          validationErrors[error.path[0]] = error.message;
        });
        setErrors(validationErrors);
      }

      toast.error(err?.data?.message || "An error occurs");
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userProfile = await getUserProfile().unwrap();
      setFormData((prev) => ({
        ...prev,
        username: userProfile.username,
        email: userProfile.email,
      }));
    } catch (error) {
      toast.error(err?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <>
      <h1 style={{ margin: "25px 0px" }}>Profile</h1>
      <Row>
        <Col>
          <Card style={{ width: "100%", minHeight: "500px", padding: "10px" }}>
            <Card.Body>
              {!isGetUserProfileLoading ? (
                <Form onSubmit={submitHandler}>
                  <Form.Group className="my-2" controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="username"
                      placeholder="Enter Username"
                      value={formData.username}
                      onChange={handleChange}
                      isInvalid={!!errors.username}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group className="my-2" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>
                  <br />
                  <Form.Check
                    type="switch"
                    id="custom-switch"
                    label="Change Password"
                    value={changePassword}
                    onChange={(e) => {
                      setChangePassword(e.target.checked);
                      setFormData((prev) => ({
                        ...prev,
                        password: "",
                        confirmPassword: "",
                      }));
                    }}
                  />
                  <br />
                  {changePassword && (
                    <>
                      <Form.Group className="my-2" controlId="password">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter Password"
                            value={formData.password}
                            onChange={handleChange}
                            isInvalid={!!errors.password}
                          />
                          <Button
                            variant="dark"
                            className="p-2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <Eye size={16} />
                            ) : (
                              <EyeOff size={16} />
                            )}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                      <Form.Group className="my-2" controlId="confirmPassword">
                        <Form.Label>Confirm Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            isInvalid={!!errors.confirmPassword}
                          />
                          <Button
                            variant="dark"
                            className="p-2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <Eye size={16} />
                            ) : (
                              <EyeOff size={16} />
                            )}
                          </Button>
                          <Form.Control.Feedback type="invalid">
                            {errors.confirmPassword}
                          </Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="dark"
                    className="my-2"
                    disabled={isUpdateUserProfileLoading}
                  >
                    {isUpdateUserProfileLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      ""
                    )}
                    Save
                  </Button>
                </Form>
              ) : (
                <Spinner animation="border" size="sm" />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default UserProfileScreen;
