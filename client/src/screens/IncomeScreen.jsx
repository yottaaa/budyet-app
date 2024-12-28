import { useEffect, useState } from "react";
import { StatBarChart } from "../components/Statistics";
import { Row, Col, Card, Form, Button, Spinner } from "react-bootstrap";
import { z } from "zod";
import CustomDataTable from "../components/CustomDataTable";
import { formatInTimeZone } from "date-fns-tz";
import {
  useGetAllIncomeMutation,
  useGetMonthlyIncomeMutation,
  useCreateIncomeMutation,
} from "../slices/incomeApiSlice";
import { format } from "date-fns";
import { toast } from "react-toastify";

const incomeSchema = z.object({
  source: z.string().min(1, "Source is required"),
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
    name: "Source",
    selector: (row) => row.source,
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

const IncomeScreen = () => {
  const [incomeForm, setIncomeForm] = useState({ source: "", amount: "" });
  const [incomeFormErrors, setIncomeFormErrors] = useState({
    source: "",
    amount: "",
  });
  const [rows, setRows] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState([]);
  const [paginationData, setPaginationData] = useState({
    page: 1,
    totalRows: 0,
    perPage: 10,
  });

  const [getAllIncome, { isLoading: isAllIncomeLoading }] =
    useGetAllIncomeMutation();
  const [getMonthlyIncome, { isLoading: isMonthlyIncomeLoading }] =
    useGetMonthlyIncomeMutation();
  const [createIncome, { isLoading: isCreateIncomeLoading }] =
    useCreateIncomeMutation();

  const fetchAllIncome = async (body = {}, params = { page: 1, size: 10 }) => {
    try {
      // Validate and convert dates if provided
      if (body.startDate && body.endDate) {
        // Convert to UTC
        body.startDate = convertToUTCWithLocalTimezone(body.startDate, true);
        body.endDate = convertToUTCWithLocalTimezone(body.endDate, false);
      }

      const allIncome = await getAllIncome({
        body,
        params,
      }).unwrap();
      setRows(allIncome.data);
      setPaginationData({
        page: params.page,
        totalRows: allIncome.metadata.totalRecords,
        perPage: params.size,
      });
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  const fetchMonthlyIncome = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;

    try {
      const monthlyIncomeRes = await getMonthlyIncome({
        body: { startDate, endDate },
      }).unwrap();
      setMonthlyIncome(monthlyIncomeRes);
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchAllIncome();
  }, [getAllIncome, setRows]);

  useEffect(() => {
    fetchMonthlyIncome();
  }, [getMonthlyIncome, setMonthlyIncome]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setIncomeForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setIncomeFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      incomeSchema.parse(incomeForm); // Validate form data

      await createIncome(incomeForm).unwrap();

      toast.success("Income created successfully");

      fetchAllIncome();
      fetchMonthlyIncome();
      // Clear errors and proceed with form submission
      setIncomeFormErrors({ source: "", amount: "" });
      setIncomeForm({ source: "", amount: "" });
    } catch (err) {
      const validationErrors = {};
      err.errors.forEach((error) => {
        validationErrors[error.path[0]] = error.message;
      });
      setIncomeFormErrors(validationErrors);

      toast.error(err?.data?.message || "An error occured");
    }
  };

  return (
    <>
      <h1 style={{ margin: "25px 0px" }}>Income</h1>
      <Row>
        <Col xs={12} md={6}>
          <Card style={{ width: "100%", minHeight: "500px", padding: "10px" }}>
            <Card.Title style={{ textAlign: "center" }}>Add Income</Card.Title>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="my-2" controlId="source">
                  <Form.Label>Source</Form.Label>
                  <Form.Control
                    type="text"
                    name="source"
                    value={incomeForm.source}
                    onChange={handleChange}
                    isInvalid={!!incomeFormErrors.source}
                    placeholder="Enter source"
                  />
                  <Form.Control.Feedback type="invalid">
                    {incomeFormErrors.source}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="my-2" controlId="amount">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="text" // Use "text" to avoid parsing issues while typing
                    name="amount"
                    value={incomeForm.amount}
                    onChange={handleChange}
                    isInvalid={!!incomeFormErrors.amount}
                    placeholder="Enter amount"
                  />
                  <Form.Control.Feedback type="invalid">
                    {incomeFormErrors.amount}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  variant="dark"
                  className="my-2"
                  disabled={isCreateIncomeLoading}
                >
                  {isCreateIncomeLoading ? (
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
              Monthly Income
            </Card.Title>
            <Card.Body>
              <StatBarChart
                data={monthlyIncome}
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
            fetchData={fetchAllIncome}
            paginationData={paginationData}
            title="Income Data"
            pending={isAllIncomeLoading}
            searchParams={["Source"]}
          />
        </Col>
      </Row>
    </>
  );
};

export default IncomeScreen;
