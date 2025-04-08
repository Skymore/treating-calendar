import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Personnel } from "../types/types";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";

interface PersonnelListProps {
  personnel: Personnel[];
  onPersonnelDeleted: () => void;
  calculateFutureHostingCounts: (personId: string) => number;
}

export function PersonnelList({ personnel, onPersonnelDeleted, calculateFutureHostingCounts }: PersonnelListProps) {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personnel')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onPersonnelDeleted();
    } catch (error) {
      console.error('Error deleting personnel:', error);
    }
  };

  return (
    <Table aria-label="Personnel list">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>EMAIL</TableColumn>
        <TableColumn>PHONE</TableColumn>
        <TableColumn>HOSTED</TableColumn>
        <TableColumn>FUTURE HOSTING</TableColumn>
        <TableColumn>LAST HOSTED</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {personnel.map((person) => (
          <TableRow key={person.id}>
            <TableCell>{person.name}</TableCell>
            <TableCell>{person.email}</TableCell>
            <TableCell>{person.phone || "-"}</TableCell>
            <TableCell>{person.hostingCount}</TableCell>
            <TableCell>{calculateFutureHostingCounts(person.id)}</TableCell>
            <TableCell>
              {person.lastHosted ? format(new Date(person.lastHosted), 'MMM d, yyyy') : '-'}
            </TableCell>
            <TableCell>
              <Button
                isIconOnly
                color="danger"
                variant="light"
                onPress={() => handleDelete(person.id)}
              >
                <Icon icon="lucide:trash-2" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
