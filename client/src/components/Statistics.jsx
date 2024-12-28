import React, { PureComponent } from "react";
import { Card, Container, Row, Col, Stack } from "react-bootstrap";
import { PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Rectangle,
} from "recharts";
import { formatNumber } from "../utils/stringUtils";

class CustomTooltip extends PureComponent {
  render() {
    const { active, payload, label } = this.props;

    if (active && payload && payload.length) {
      const income = formatNumber(payload.find((item) => item.dataKey === 'income')?.value) || "0.00";
      const expense = formatNumber(payload.find((item) => item.dataKey === 'expense')?.value) || "0.00";
      const total = formatNumber(payload.find((item) => item.payload)?.payload?.total) || "0.00";

      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label">{`Month: ${label}`}</p>
          <p>{`Income: ${income}`}</p>
          <p>{`Expense: ${expense}`}</p>
          <p>{`Total: ${total}`}</p>
        </div>
      );
    }

    return null;
  }
}

export class StatBarChart extends PureComponent {
  render() {
    const { data, xDataKey, barDataKey } = this.props;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xDataKey} angle={315} tick={{ fontSize: 10, fontWeight: 'bold'}}/>
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar
            dataKey={barDataKey}
            fill="#181C14"
            barSize={10}
            radius={[10, 10, 0, 0]} // Rounded corners
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
}

export class StatLineChart extends PureComponent {
  render() {
    const { data } = this.props;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" angle={315} tick={{ fontSize: 10, fontWeight: 'bold'}}/>
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#181C14"
            activeDot={{ r: 8 }}
          />
          <Line type="monotone" dataKey="expense" stroke="#AB4459" />
        </LineChart>
      </ResponsiveContainer>
    );
  }
}

export class StatPieChart extends PureComponent {
  render() {
    const { data } = this.props;

    if (!data || data.length === 0) {
      // Handle empty data array
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          No data available to display.
        </div>
      );
    }

    // Calculate the total amount
    const totalAmount = data.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0);

    // Map `totalAmount` to `value` and calculate percentage
    const formattedData = data.map((item) => ({
      name: item.tag,
      value: parseFloat(item.totalAmount),
      percentage: ((parseFloat(item.totalAmount) / totalAmount) * 100).toFixed(2), // Percentage with 2 decimals
    }));

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            dataKey="value"
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="#AB4459"
            label={({ name, percentage }) => `${name} (${percentage}%) `} // Label with percentage
          />
          <Tooltip
            formatter={(value, name, props) => {
              const percentage = props.payload.percentage; // Get the percentage from payload
              return [`${value} (${percentage}%)`, name]; // Tooltip showing value and percentage
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }
}

const Statistics = ({ data }) => {
  return (
    <div style={{ marginTop: "20px", marginBottom: "20px" }}>
      <Row>
        <Col xs={12} md={4}>
          <Card bg={"dark"} text={"light"} style={{ padding: "10px" }}>
            <Card.Body>
              <Stack direction="horizontal" gap={3}>
                <PiggyBank size={30} />
                <div>
                  <Card.Title>Total Balance</Card.Title>
                  <Card.Text>{`Php ${data.statNumbers.totalBalance}`}</Card.Text>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bg={"dark"} text={"light"} style={{ padding: "10px" }}>
            <Card.Body>
              <Stack direction="horizontal" gap={3}>
                <TrendingUp size={30} />
                <div>
                  <Card.Title>Total Income</Card.Title>
                  <Card.Text>{`Php ${data.statNumbers.totalIncome}`}</Card.Text>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card bg={"dark"} text={"light"} style={{ padding: "10px" }}>
            <Card.Body>
              <Stack direction="horizontal" gap={3}>
                <TrendingDown size={30} />
                <div>
                  <Card.Title>Total Expense</Card.Title>
                  <Card.Text>{`Php ${data.statNumbers.totalExpense}`}</Card.Text>
                </div>
              </Stack>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <br />
      <Row>
        <Col xs={12} md={6}>
          <Card style={{ width: "100%", height: "500px", padding: "10px" }}>
            <Card.Title style={{ textAlign: "center" }}>Timeline</Card.Title>
            <Card.Body>
              <StatLineChart data={data.monthlyBalance} />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ width: "100%", height: "500px", padding: "10px" }}>
            <Card.Title style={{ textAlign: "center" }}>Top Items</Card.Title>
            <Card.Body>
              <StatPieChart data={data.topItems} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
