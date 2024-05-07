ANSIBLE_INVENTORY ?= inventory/exmplae.yaml

eureka-operators:
	ansible-playbook -i $(ANSIBLE_INVENTORY) playbooks/converge.yml

connectivity-test:
	ansible-playbook -i $(ANSIBLE_INVENTORY) playbooks/check-access.yml
