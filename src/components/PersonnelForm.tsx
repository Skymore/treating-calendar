import React from "react";
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { supabase } from "../lib/supabase";

interface PersonnelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonnelAdded: () => void;
}

export function PersonnelForm({ isOpen, onClose, onPersonnelAdded }: PersonnelFormProps) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('personnel')
        .insert([
          {
            name,
            email,
            phone: phone || null,
            hostingCount: 0
          }
        ]);

      if (error) throw error;
      
      onPersonnelAdded();
      onClose();
      setName("");
      setEmail("");
      setPhone("");
    } catch (error) {
      console.error('Error adding personnel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Add New Personnel</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                variant="bordered"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="bordered"
              />
              <Input
                label="Phone (Optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                variant="bordered"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit" isLoading={isLoading}>
              Add Personnel
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
