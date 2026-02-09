import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table';

describe('Table', () => {
  it('renders a complete table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Agent A</TableCell>
            <TableCell>Active</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Agent A')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('Table wraps content in a scrollable div with table element', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow><TableCell>X</TableCell></TableRow>
        </TableBody>
      </Table>
    );
    expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument();
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('TableHeader renders thead', () => {
    const { container } = render(
      <table>
        <TableHeader>
          <tr><th>Col</th></tr>
        </TableHeader>
      </table>
    );
    expect(container.querySelector('thead')).toBeInTheDocument();
  });

  it('TableBody renders tbody', () => {
    const { container } = render(
      <table>
        <TableBody>
          <tr><td>Data</td></tr>
        </TableBody>
      </table>
    );
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('TableRow renders tr', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow><td>Cell</td></TableRow>
        </tbody>
      </table>
    );
    expect(container.querySelector('tr')).toBeInTheDocument();
  });

  it('TableRow accepts custom className', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow className="custom-class"><td>X</td></TableRow>
        </tbody>
      </table>
    );
    const row = container.querySelector('tr');
    expect(row?.classList.contains('custom-class')).toBe(true);
  });

  it('TableHead renders th with uppercase styling', () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead>Header</TableHead>
          </tr>
        </thead>
      </table>
    );
    const th = container.querySelector('th');
    expect(th).toBeInTheDocument();
    expect(th?.classList.contains('uppercase')).toBe(true);
  });

  it('TableCell renders td with whitespace-nowrap', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>Content</TableCell>
          </tr>
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toBeInTheDocument();
    expect(td?.classList.contains('whitespace-nowrap')).toBe(true);
  });

  it('TableCell accepts custom className', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell className="text-right">X</TableCell>
          </tr>
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td?.classList.contains('text-right')).toBe(true);
  });
});
