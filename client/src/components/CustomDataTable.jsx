import React, { useState } from "react";
import {
  Card,
  Spinner,
  Row,
  Col,
  Form,
  InputGroup,
  Button,
  Stack,
  Dropdown,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import { X } from "lucide-react";

const CustomDataTable = ({
  title,
  data,
  pending,
  fetchData,
  paginationData,
  searchParams,
}) => {
  const [searchData, setSearchData] = useState("");
  const [filterData, setFilterData] = useState({
    column: data.columns[data.columns.length - 1].name,
    orderBy: "DESC",
    dateRange: {
      startDate: "",
      endDate: "",
    },
  });

  const handlePageChange = async (page) => {
    await fetchData({
      body: {
        startDate: filterData.dateRange.startDate,
        endDate: filterData.dateRange.endDate,
        sortBy: {
          column: filterData.column,
          orderBy: filterData.orderBy,
        },
        q: searchData,
      },
      params: { page: page, size: paginationData.perPage },
    });
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    await fetchData({
      body: {
        startDate: filterData.dateRange.startDate,
        endDate: filterData.dateRange.endDate,
        sortBy: {
          column: filterData.column,
          orderBy: filterData.orderBy,
        },
        q: searchData,
      },
      params: { page: page, size: newPerPage },
    });
  };

  const handleFilterSubmit = async () => {
    await fetchData(
      {
        startDate: filterData.dateRange.startDate,
        endDate: filterData.dateRange.endDate,
        sortBy: {
          column: filterData.column,
          orderBy: filterData.orderBy,
        },
        q: searchData,
      },
      { page: paginationData.page, size: paginationData.perPage }
    );
  };

  const handleResetFilter = () => {
    setFilterData({
      column: data.columns[data.columns.length - 1].name,
      orderBy: "DESC",
      dateRange: {
        startDate: "",
        endDate: "",
      },
    });
  };

  const handleSearchSubmit = async () => {
    await fetchData(
      {
        startDate: filterData.dateRange.startDate,
        endDate: filterData.dateRange.endDate,
        sortBy: {
          column: filterData.column,
          orderBy: filterData.orderBy,
        },
        q: searchData,
      },
      { page: paginationData.page, size: paginationData.perPage }
    );
  };

  const handleClear = async () => {
    setSearchData("")
    await fetchData();
  }

  return (
    <Card>
      <Card.Body>
        <Stack direction="horizontal" gap={3}>
          <h4 className="p-2">{title}</h4>
          <div className="p-2 ms-auto">
            <InputGroup>
              {searchData && searchData.length > 0 && (
                <Button variant="danger" id="search" className="p-2" onClick={handleClear}>
                  <X size={16} />
                </Button>
              )}
              <Form.Control
                placeholder={`Enter ${searchParams.join(" or ")}`}
                aria-label="keyword"
                aria-describedby="search"
                value={searchData}
                onChange={(e) => setSearchData(e.target.value)}
              />
              <Button
                variant="dark"
                id="search"
                className="p-2"
                onClick={handleSearchSubmit}
                disabled={pending}
              >
                Search
              </Button>
            </InputGroup>
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="dark">Filter</Dropdown.Toggle>

            <Dropdown.Menu>
              <Form
                style={{ padding: "10px", minWidth: "300px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <Form.Label>Filter</Form.Label>
                <Stack direction="horizontal" gap={2}>
                  <Form.Group>
                    <Form.Label>Column</Form.Label>
                    <Form.Select
                      aria-label="Default select example"
                      value={filterData.column}
                      onChange={(e) =>
                        setFilterData((prev) => ({
                          ...prev,
                          column: e.target.value,
                        }))
                      }
                    >
                      {data.columns ? (
                        data.columns.map((item, idx) => (
                          <option key={idx} value={item.name}>
                            {item.name}
                          </option>
                        ))
                      ) : (
                        <option>No Option</option>
                      )}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Order By</Form.Label>
                    <Form.Select
                      aria-label="Default select example"
                      value={filterData.orderBy}
                      onChange={(e) =>
                        setFilterData((prev) => ({
                          ...prev,
                          orderBy: e.target.value,
                        }))
                      }
                    >
                      <option value="DESC">DESC</option>
                      <option value="ASC">ASC</option>
                    </Form.Select>
                  </Form.Group>
                </Stack>
                <br />
                <Form.Group>
                  <Form.Label>Date Range</Form.Label>
                  <Stack direction="horizontal" gap={2}>
                    <Form.Control
                      type="date"
                      value={filterData.dateRange.startDate}
                      onChange={(e) =>
                        setFilterData((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            startDate: e.target.value,
                          },
                        }))
                      }
                    ></Form.Control>
                    <Form.Control
                      type="date"
                      value={filterData.dateRange.endDate}
                      onChange={(e) =>
                        setFilterData((prev) => ({
                          ...prev,
                          dateRange: {
                            ...prev.dateRange,
                            endDate: e.target.value,
                          },
                        }))
                      }
                    ></Form.Control>
                  </Stack>
                </Form.Group>
                <br />
                <Stack direction="horizontal" gap={2}>
                  <Button
                    variant="dark"
                    onClick={handleFilterSubmit}
                    disabled={pending}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleResetFilter}
                    disabled={pending}
                  >
                    Reset
                  </Button>
                </Stack>
              </Form>
            </Dropdown.Menu>
          </Dropdown>
        </Stack>
        <Row>
          <Col>
            <DataTable
              columns={data.columns}
              data={data.rows}
              pagination
              fixedHeader
              responsive
              progressPending={pending}
              progressComponent={<Spinner />}
              paginationServer
              paginationTotalRows={paginationData.totalRows}
              onChangeRowsPerPage={handlePerRowsChange}
              onChangePage={handlePageChange}
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default CustomDataTable;
