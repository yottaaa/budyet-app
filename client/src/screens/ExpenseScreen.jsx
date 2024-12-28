import { useEffect, useState } from "react";
import { StatBarChart } from "../components/Statistics";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import { z } from "zod";
import CustomDataTable from "../components/CustomDataTable";
import { formatInTimeZone } from "date-fns-tz";
import {
  useGetAllExpenseMutation,
  useGetMonthlyExpenseMutation,
  useCreateExpenseMutation,
  useGetAllTagsMutation,
} from "../slices/expenseApiSlice";
import { toast } from "react-toastify";
import CreatableSelect from "react-select/creatable";

const expenseSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.preprocess(
    (value) => Number(value),
    z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .refine((val) => val > 0, { message: "Amount must be greater than 0" })
  ),
});

const columns = [
  {
    name: "#",
    cell: (row, rowIndex) => rowIndex + 1,
  },
  {
    name: "Tag",
    selector: (row) => row.tag,
  },
  {
    name: "Description",
    selector: (row) => row.description,
  },
  {
    name: "Amount",
    selector: (row) => row.amount,
  },
  {
    name: "Created At",
    width: "250px",
    selector: (row) => row.createdAt,
    cell: (row) => {
      const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return formatInTimeZone(
        new Date(row.createdAt),
        localTimeZone,
        "d MMM yyyy | hh:mm a"
      );
    },
  },
];

const ExpenseScreen = () => {
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    tag: "",
  });
  const [expenseFormErrors, setExpenseFormErrors] = useState({
    description: "",
    amount: "",
    tag: "",
  });
  const [rows, setRows] = useState([]);
  const [monthlyExpense, setMonthlyExpense] = useState([]);
  const [tagSelect, setTagSelect] = useState(null);
  const [tagOptions, setTagOptions] = useState([]);
  const [paginationData, setPaginationData] = useState({
    page: 1,
    totalRows: 0,
    perPage: 10,
  });

  const [getAllExpense, { isLoading: isAllExpenseLoading }] =
    useGetAllExpenseMutation();
  const [getMonthlyExpense, { isLoading: isMonthlyExpenseLoading }] =
    useGetMonthlyExpenseMutation();
  const [createExpense, { isLoading: isCreateExpenseLoading }] =
    useCreateExpenseMutation();
  const [getAllTags, { isLoading: isGetAllTagsLoading }] =
    useGetAllTagsMutation();

  const fetchAllExpense = async (body = {}, params = { page: 1, size: 10 }) => {
    try {
      // Validate and convert dates if provided
      if (body.startDate && body.endDate) {
        // Convert to UTC
        body.startDate = convertToUTCWithLocalTimezone(body.startDate, true);
        body.endDate = convertToUTCWithLocalTimezone(body.endDate, false);
      }

      const allExpense = await getAllExpense({
        body,
        params,
      }).unwrap();
      setRows(allExpense.data);
      setPaginationData({
        page: params.page,
        totalRows: allExpense.metadata.totalRecords,
        perPage: params.size,
      });
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  const fetchMonthlyExpense = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;

    try {
      const monthlyExpenseRes = await getMonthlyExpense({
        body: { startDate, endDate },
      }).unwrap();
      setMonthlyExpense(monthlyExpenseRes);
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  const fetchAllTags = async () => {
    try {
      const allTags = await getAllTags({
        params: { sortBy: "count" },
      }).unwrap();
      setTagOptions(
        allTags.map((item) => ({ label: item.tag, value: item.tag }))
      );
    } catch (error) {
      toast.error(err?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchAllExpense();
    fetchMonthlyExpense();
    fetchAllTags();
  }, [getAllExpense, setRows, getMonthlyExpense, setMonthlyExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setExpenseForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setExpenseFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      expenseSchema.parse(expenseForm); // Validate form data

      await createExpense(expenseForm).unwrap();

      toast.success("Expense created successfully");

      fetchAllExpense();
      fetchMonthlyExpense();
      // Clear errors and proceed with form submission
      setExpenseFormErrors({ description: "", amount: "", tag: "" });
      setExpenseForm({ description: "", amount: "", tag: "" });
      setTagSelect(null);
    } catch (err) {
      if (err.errors) {
        const validationErrors = {};
        err.errors.forEach((error) => {
          validationErrors[error.path[0]] = error.message;
        });
        setExpenseFormErrors(validationErrors);
      }

      toast.error(err?.data?.message || "An error occured");
    }
  };

  return (
    <>
      <h1 style={{ margin: "25px 0px" }}>Expense</h1>
      <Row>
        <Col xs={12} md={6}>
          <Card style={{ width: "100%", minHeight: "500px", padding: "10px" }}>
            <Card.Title style={{ textAlign: "center" }}>Add Expense</Card.Title>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="my-2" controlId="tag">
                  <Form.Label>Tag</Form.Label>
                  <CreatableSelect
                    isClearable
                    isLoading={isGetAllTagsLoading}
                    options={tagOptions}
                    value={tagSelect}
                    onChange={(item) => {
                      if (item) {
                        setTagSelect(item);
                        setExpenseForm((prevData) => ({
                          ...prevData,
                          tag: item.value,
                        }));
                        setExpenseFormErrors((prevErrors) => ({
                          ...prevErrors,
                          tag: "",
                        }));
                      } else {
                        setTagSelect(null);
                        setExpenseForm((prevData) => ({
                          ...prevData,
                          tag: "",
                        }));
                        setExpenseFormErrors((prevErrors) => ({
                          ...prevErrors,
                          tag: "",
                        }));
                      }
                    }}
                    onCreateOption={(item) => {
                      setTimeout(() => {
                        const newOption = {
                          label: item,
                          value: item,
                        };
                        setTagOptions((prev) => [...prev, newOption]);
                        setTagSelect(newOption);
                        setExpenseForm((prevData) => ({
                          ...prevData,
                          tag: item,
                        }));
                      }, 500);
                    }}
                    className={expenseFormErrors.tag ? "is-invalid" : ""}
                  />
                  <Form.Control.Feedback type="invalid">
                    {expenseFormErrors.tag}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="my-2" controlId="description">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    name="description"
                    value={expenseForm.description}
                    onChange={handleChange}
                    isInvalid={!!expenseFormErrors.description}
                    placeholder="Enter description"
                  />
                  <Form.Control.Feedback type="invalid">
                    {expenseFormErrors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="my-2" controlId="amount">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="text" // Use "text" to avoid parsing issues while typing
                    name="amount"
                    value={expenseForm.amount}
                    onChange={handleChange}
                    isInvalid={!!expenseFormErrors.amount}
                    placeholder="Enter amount"
                  />
                  <Form.Control.Feedback type="invalid">
                    {expenseFormErrors.amount}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  variant="dark"
                  className="my-2"
                  disabled={isCreateExpenseLoading}
                >
                  {isCreateExpenseLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    ""
                  )}
                  Submit
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ width: "100%", minHeight: "500px", padding: "10px" }}>
            <Card.Title style={{ textAlign: "center" }}>
              Monthly Expense
            </Card.Title>
            <Card.Body>
              <StatBarChart
                data={monthlyExpense}
                xDataKey="month"
                barDataKey="total"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <br />
      <Row>
        <Col>
          <CustomDataTable
            data={{ columns, rows }}
            fetchData={fetchAllExpense}
            paginationData={paginationData}
            title="Expense Data"
            pending={isAllExpenseLoading}
            searchParams={["Tag", "Description"]}
          />
        </Col>
      </Row>
    </>
  );
};

export default ExpenseScreen;
