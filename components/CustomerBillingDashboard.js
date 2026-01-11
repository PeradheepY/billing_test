import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomerBillingDashboard = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const getPaymentStatus = (customer) => {
    if (customer.totalDue === 0) return 'paid';
    if (customer.totalDue === customer.totalAmount) return 'unpaid';
    return 'partial';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500';
      case 'unpaid':
        return 'bg-red-500';
      case 'partial':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = (
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerPhone.includes(searchTerm)
    );

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && getPaymentStatus(customer) === filterStatus;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Customer Billing Overview</CardTitle>
        <CardDescription>
          Manage and track customer billing status and payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {customer.customerName}
                  </TableCell>
                  <TableCell>{customer.customerEmail}</TableCell>
                  <TableCell>{customer.customerPhone}</TableCell>
                  <TableCell>
                    ${customer.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${(customer.totalAmount - customer.totalDue).toFixed(2)}
                  </TableCell>
                  <TableCell>${customer.totalDue.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getStatusColor(getPaymentStatus(customer))} text-white`}
                    >
                      {getPaymentStatus(customer).toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerBillingDashboard;