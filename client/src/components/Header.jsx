import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "../slices/usersApiSlice";
import { clearCredentials } from "../slices/authSlice";
import { LogIn, LogOut, User, SquareUserRound, HandCoins } from "lucide-react";

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logoutApiCall] = useLogoutMutation();

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(clearCredentials());
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header>
      <Navbar
        bg="light"
        variant="light"
        expand="lg"
        collapseOnSelect
        className="justify-content-between"
      >
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>
              <HandCoins /> Budyet
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav variant="underline" className="ms-auto">
              {userInfo && (
                <>
                  <LinkContainer to="/">
                    <Nav.Link>Home</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/income">
                    <Nav.Link>Income</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/expense">
                    <Nav.Link>Expense</Nav.Link>
                  </LinkContainer>
                  <NavDropdown
                    title={
                      <>
                        <User /> {userInfo.username}
                      </>
                    }
                    id="username"
                  >
                    <LinkContainer to="/profile">
                      <NavDropdown.Item>
                        <SquareUserRound /> Profile
                      </NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logoutHandler}>
                      <LogOut /> Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
